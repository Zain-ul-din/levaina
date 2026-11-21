"use client";

import { useChatActions, useChatMessages } from "./chat-provider";
import { ChatEmptyState } from "./chat-empty-state";
import { ChatError } from "./chat-error";
import { MessageList } from "./message-list";
import { PendingIndicator } from "./primitives/pending-indicator";

/** Connects chat state to the list. The only component that re-renders on every streamed chunk. */
export function MessageListContainer() {
  const messages = useChatMessages();
  const { status, error } = useChatActions();

  if (messages.length === 0) {
    return <ChatEmptyState />;
  }

  const lastMessage = messages.at(-1);
  const streamingMessageId =
    status === "streaming" && lastMessage?.role === "assistant"
      ? lastMessage.id
      : undefined;

  return (
    <MessageList messages={messages} streamingMessageId={streamingMessageId}>
      {status === "submitted" && <PendingIndicator />}
      {error && <ChatError />}
    </MessageList>
  );
}
