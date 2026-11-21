"use client";

import { useChat } from "@ai-sdk/react";
import type { ChatUIMessage } from "@/lib/chat/types";
import { createContext, useCallback, useMemo, type ReactNode } from "react";
import { useRequiredContext } from "@/lib/hooks/use-require-context";

type UseChatResult = ReturnType<typeof useChat<ChatUIMessage>>;

/** Things that rarely change: safe for inputs and buttons to subscribe to. */
type ChatActions = Pick<
  UseChatResult,
  "sendMessage" | "stop" | "regenerate" | "status" | "error"
> & {
  /** True when a new message may be sent. "error" counts, so one failed request can't lock the input. */
  canSend: boolean;
  /** True from the moment a message is sent until the reply finishes. */
  isBusy: boolean;
  /** Flips once per conversation, so subscribing to it doesn't re-render on every chunk. */
  hasMessages: boolean;
  /** Stops any reply and clears the conversation. Memories are kept: a new chat still knows you. */
  startNewChat: () => void;
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
  const { messages, setMessages, sendMessage, stop, regenerate, status, error } =
    useChat<ChatUIMessage>();
  const canSend = status === "ready" || status === "error";
  const isBusy = status === "submitted" || status === "streaming";
  const hasMessages = messages.length > 0;

  const startNewChat = useCallback(() => {
    void stop();
    setMessages([]);
  }, [stop, setMessages]);

  // The functions are stable, so this object only changes when status, error or hasMessages change.
  const actions = useMemo<ChatActions>(
    () => ({ sendMessage, stop, regenerate, status, error, canSend, isBusy, hasMessages, startNewChat }),
    [sendMessage, stop, regenerate, status, error, canSend, isBusy, hasMessages, startNewChat],
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
