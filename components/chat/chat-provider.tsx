"use client";

import { useChat } from "@ai-sdk/react";
import type { ChatUIMessage } from "@/lib/chat/types";
import { createContext, use, useMemo, type ReactNode } from "react";

type UseChatResult = ReturnType<typeof useChat<ChatUIMessage>>;

/** Things that rarely change: safe for inputs and buttons to subscribe to. */
type ChatActions = Pick<UseChatResult, "sendMessage" | "stop" | "status"> & {
  /** True when a new message may be sent. "error" counts, so one failed request can't lock the input. */
  canSend: boolean;
};

/** Changes on every streamed chunk: only message renderers should subscribe. */
type ChatMessages = UseChatResult["messages"];

const ChatActionsContext = createContext<ChatActions | null>(null);
const ChatMessagesContext = createContext<ChatMessages | null>(null);

/**
 * Owns the single useChat instance and splits it into two contexts,
 * so a component that only sends messages doesn't re-render while a reply streams.
 */
export function ChatProvider({ children }: { children: ReactNode }) {
  const { messages, sendMessage, stop, status } = useChat<ChatUIMessage>();
  const canSend = status === "ready" || status === "error";

  // sendMessage/stop are stable, so this object only changes when status changes.
  const actions = useMemo<ChatActions>(
    () => ({ sendMessage, stop, status, canSend }),
    [sendMessage, stop, status, canSend],
  );

  return (
    <ChatActionsContext value={actions}>
      <ChatMessagesContext value={messages}>{children}</ChatMessagesContext>
    </ChatActionsContext>
  );
}

export function useChatActions() {
  return useRequiredContext(ChatActionsContext, "useChatActions");
}

export function useChatMessages() {
  return useRequiredContext(ChatMessagesContext, "useChatMessages");
}

function useRequiredContext<T>(context: React.Context<T | null>, hookName: string): T {
  const value = use(context);
  if (value === null) {
    throw new Error(`${hookName} must be used inside <ChatProvider>`);
  }
  return value;
}
