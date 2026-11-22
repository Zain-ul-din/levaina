"use client";

import { useRequiredContext } from "@/lib/hooks/use-require-context";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useMemo, useRef, type ReactNode } from "react";
import { useChats } from "./use-chats";

type ChatHistoryContextValue = {
  /** The one chat list, shared by the docked sidebar and the phone drawer. */
  history: ReturnType<typeof useChats>;
  /** Starts a new chat in whichever chat is on screen. */
  newChat: () => void;
  /** The chat on screen hands over its own "new chat"; returns the cleanup that takes it back. */
  registerNewChat: (startNewChat: () => void) => () => void;
  /** The chat on screen reports a finished reply, so the list can show a new or re-ordered chat. */
  replyFinished: () => void;
};

const ChatHistoryContext = createContext<ChatHistoryContextValue | null>(null);

/**
 * Lives in the chat layout, above the pages, so the list survives moving between chats
 * (a page swap would otherwise reload it). The page's chat talks to it through
 * registerNewChat and replyFinished, instead of the list reaching into the chat.
 */
export function ChatHistoryProvider({ children }: { children: ReactNode }) {
  const history = useChats();
  const router = useRouter();
  const startNewChatRef = useRef<(() => void) | null>(null);
  const { status, refresh } = history;

  const registerNewChat = useCallback((startNewChat: () => void) => {
    startNewChatRef.current = startNewChat;
    // Only clear it if no newer chat has registered since (pages swap in either order).
    return () => {
      if (startNewChatRef.current === startNewChat) startNewChatRef.current = null;
    };
  }, []);

  const newChat = useCallback(() => {
    if (startNewChatRef.current) startNewChatRef.current();
    else router.push("/");
  }, [router]);

  // Nothing to refresh until the list has been shown once.
  const replyFinished = useCallback(() => {
    if (status === "ready") void refresh();
  }, [status, refresh]);

  const value = useMemo(
    () => ({ history, newChat, registerNewChat, replyFinished }),
    [history, newChat, registerNewChat, replyFinished],
  );

  return <ChatHistoryContext value={value}>{children}</ChatHistoryContext>;
}

export function useChatHistory() {
  return useRequiredContext(ChatHistoryContext, "useChatHistory");
}
