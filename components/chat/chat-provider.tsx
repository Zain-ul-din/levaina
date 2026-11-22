"use client";

import { useChat } from "@ai-sdk/react";
import { useRouter } from "next/navigation";
import { createChatSession } from "@/lib/chat/chat-transport";
import type { ChatUIMessage } from "@/lib/chat/types";
import { useChatHistory } from "@/components/chats/chat-history-context";
import { createContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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

type ChatProviderProps = {
  children: ReactNode;
  /** A saved chat to reopen; omit for a new one. */
  chatId?: string;
  initialMessages?: ChatUIMessage[];
};

/**
 * Owns the single useChat instance and splits it into two contexts,
 * so a component that only sends messages doesn't re-render while a reply streams.
 */
export function ChatProvider({ children, chatId: savedChatId, initialMessages }: ChatProviderProps) {
  const router = useRouter();

  // Created once per provider; holds the chat's id outside React state (see createChatSession).
  const [chatSession] = useState(() => createChatSession(savedChatId));

  // Bumped by "New chat": a new key makes useChat start an empty conversation.
  const [session, setSession] = useState(0);
  const isSavedSession = session === 0 && savedChatId !== undefined;
  const { messages, sendMessage, stop, regenerate, status, error } = useChat<ChatUIMessage>({
    id: isSavedSession ? savedChatId : `new-${session}`,
    messages: isSavedSession ? initialMessages : undefined,
    transport: chatSession.transport,
  });
  const canSend = status === "ready" || status === "error";
  const isBusy = status === "submitted" || status === "streaming";
  const hasMessages = messages.length > 0;

  const startNewChat = useCallback(() => {
    void stop();
    chatSession.startNew();
    setSession((value) => value + 1);
    router.push("/");
  }, [stop, router, chatSession]);

  // Tell the chat list (sidebar / drawer) about this chat: its "new chat" while it's on screen
  // (hidden pages run their cleanup, so the visible chat always wins), and each finished reply.
  const { registerNewChat, replyFinished } = useChatHistory();
  useEffect(() => registerNewChat(startNewChat), [registerNewChat, startNewChat]);
  const previousStatus = useRef(status);
  useEffect(() => {
    const wasReplying = previousStatus.current === "submitted" || previousStatus.current === "streaming";
    previousStatus.current = status;
    if (wasReplying && status === "ready") replyFinished();
  }, [status, replyFinished]);

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
