"use client";

import { deleteChatRequest, fetchChatsRequest } from "@/lib/chats/chat-api";
import type { ChatSummary } from "@/lib/chats/chat-store";
import { useCallback, useEffect, useRef, useState } from "react";

type Status = "idle" | "loading" | "ready" | "error";

const isAbort = (error: unknown) => error instanceof DOMException && error.name === "AbortError";

/** Loads the chat list on demand, a page at a time, and deletes chats optimistically. */
export function useChats() {
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const requestRef = useRef<AbortController | null>(null);

  const fetchPage = useCallback(async (before?: string) => {
    requestRef.current?.abort();
    const request = new AbortController();
    requestRef.current = request;
    const page = await fetchChatsRequest(before, request.signal);
    setNextBefore(page.nextBefore);
    return page.chats;
  }, []);

  /** Call when the list is shown; always refetches, since a chat may have been added since. */
  const load = useCallback(async () => {
    setStatus("loading");
    setError(null);
    try {
      setChats(await fetchPage());
      setStatus("ready");
    } catch (err) {
      if (isAbort(err)) return;
      setError(err instanceof Error ? err.message : "Couldn't load your chats.");
      setStatus("error");
    }
  }, [fetchPage]);

  const loadMore = useCallback(async () => {
    if (!nextBefore) return;
    setIsLoadingMore(true);
    try {
      const older = await fetchPage(nextBefore);
      setChats((current) => [...current, ...older]);
    } catch (err) {
      if (!isAbort(err)) setError(err instanceof Error ? err.message : "Couldn't load more chats.");
    } finally {
      setIsLoadingMore(false);
    }
  }, [fetchPage, nextBefore]);

  /** Removes it from the list straight away; puts it back if the server refuses. */
  const remove = useCallback(async (chat: ChatSummary) => {
    setError(null);
    setChats((current) => current.filter((item) => item.id !== chat.id));
    try {
      await deleteChatRequest(chat.id);
    } catch (err) {
      setChats((current) => [...current, chat].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
      setError(err instanceof Error ? err.message : "Couldn't delete that chat.");
    }
  }, []);

  // Don't let a late response land after the component is gone.
  useEffect(() => () => requestRef.current?.abort(), []);

  return { chats, status, error, hasMore: nextBefore !== null, isLoadingMore, load, loadMore, remove };
}
