"use client";

import { useChat } from "@ai-sdk/react";
import type { ChatUIMessage } from "@/lib/chat/types";
import { createContext, use, type ReactNode } from "react";

type ChatContextValue = ReturnType<typeof useChat<ChatUIMessage>> & {
  /** True when a new message may be sent. "error" counts, so one failed request can't lock the input. */
  canSend: boolean;
};

const ChatContext = createContext<ChatContextValue | null>(null);

/** Owns the single useChat instance; any component below can read it with useChatContext(). */
export function ChatProvider({ children }: { children: ReactNode }) {
  const chat = useChat<ChatUIMessage>();
  const canSend = chat.status === "ready" || chat.status === "error";

  return <ChatContext value={{ ...chat, canSend }}>{children}</ChatContext>;
}

export function useChatContext() {
  const context = use(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used inside <ChatProvider>");
  }
  return context;
}
