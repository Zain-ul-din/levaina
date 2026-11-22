"use client";

import { fetchLogPageRequest, removeLogEntryRequest } from "@/lib/log/log-api";
import type { LogEntry } from "@/lib/log/types";
import { useCallback, useEffect, useRef, useState } from "react";

type Status = "idle" | "loading" | "ready" | "error";

const byNewest = (a: LogEntry, b: LogEntry) => b.loggedAt.localeCompare(a.loggedAt) || b.id - a.id;

/** Loads the log two weeks at a time, newest first, and removes entries optimistically. */
export function useLog() {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [oldestLoaded, setOldestLoaded] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const requestRef = useRef<AbortController | null>(null);

  const fetchPage = useCallback(async (until?: string) => {
    requestRef.current?.abort();
    const request = new AbortController();
    requestRef.current = request;
    const page = await fetchLogPageRequest(until, request.signal);
    setOldestLoaded(page.since);
    setHasMore(page.hasMore);
    return page.entries;
  }, []);

  /** Call when the list is shown; always refetches, since the coach may have logged something since. */
  const load = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      setEntries(await fetchPage());
      setStatus("ready");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Couldn't load your log.");
      setStatus("error");
    }
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (!oldestLoaded) return;
    setIsLoadingMore(true);
    setError(null);
    try {
      const older = await fetchPage(oldestLoaded);
      setEntries((current) => [...current, ...older]);
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        setError(err instanceof Error ? err.message : "Couldn't load more.");
      }
    } finally {
      setIsLoadingMore(false);
    }
  }, [fetchPage, oldestLoaded]);

  /** Removes it from the list straight away; puts it back if the server refuses. */
  const remove = useCallback(async (entry: LogEntry) => {
    setError(null);
    setEntries((current) => current.filter((item) => item.id !== entry.id));
    try {
      await removeLogEntryRequest(entry.id);
    } catch (err) {
      setEntries((current) => [...current, entry].sort(byNewest));
      setError(err instanceof Error ? err.message : "Couldn't remove that entry.");
    }
  }, []);

  /** Shows an entry saved elsewhere (the quick-log forms) without refetching. */
  const prepend = useCallback((entry: LogEntry) => {
    setEntries((current) => [entry, ...current.filter((item) => item.id !== entry.id)].sort(byNewest));
  }, []);

  /** Drops an entry that was already deleted on the server (e.g. by Undo). */
  const drop = useCallback((id: number) => {
    setEntries((current) => current.filter((item) => item.id !== id));
  }, []);

  // Don't let a late response land after the component is gone.
  useEffect(() => () => requestRef.current?.abort(), []);

  return { entries, status, error, hasMore, isLoadingMore, load, loadMore, remove, prepend, drop };
}
