"use client";

import { fetchMemoriesRequest, forgetMemoryRequest } from "@/lib/memory/memory-api";
import type { Memory } from "@/lib/memory/types";
import { useCallback, useEffect, useRef, useState } from "react";

type Status = "idle" | "loading" | "ready" | "error";

/** Loads memories on demand and forgets them optimistically. */
export function useMemories() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const requestRef = useRef<AbortController | null>(null);

  /** Call when the list is shown; always refetches, since the chat may have saved something since. */
  const load = useCallback(async () => {
    requestRef.current?.abort();
    const request = new AbortController();
    requestRef.current = request;
    setStatus("loading");
    setError(null);
    try {
      setMemories(await fetchMemoriesRequest(request.signal));
      setStatus("ready");
    } catch (err) {
      if (request.signal.aborted) return;
      setError(err instanceof Error ? err.message : "Couldn't load your memories.");
      setStatus("error");
    }
  }, []);

  /** Removes it from the list straight away; puts it back if the server refuses. */
  const forget = useCallback(async (memory: Memory) => {
    setError(null);
    setMemories((current) => current.filter((item) => item.id !== memory.id));
    try {
      await forgetMemoryRequest(memory.id);
    } catch (err) {
      setMemories((current) => [...current, memory].sort(byNewest));
      setError(err instanceof Error ? err.message : "Couldn't remove that memory.");
    }
  }, []);

  // Don't let a late response land after the component is gone.
  useEffect(() => () => requestRef.current?.abort(), []);

  return { memories, status, error, load, forget };
}

const byNewest = (a: Memory, b: Memory) => b.createdAt.localeCompare(a.createdAt);
