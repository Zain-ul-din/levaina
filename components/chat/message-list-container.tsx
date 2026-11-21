"use client";

import { useChatActions, useChatMessages } from "./chat-provider";
import { ChatEmptyState } from "./chat-empty-state";
import { ChatError } from "./chat-error";
import { MessageList } from "./message-list";
import { PendingIndicator } from "./primitives/pending-indicator";

/** Connects chat state to the list. The only component that re-renders on every streamed chunk. */
export function MessageListContainer() {
  const messages = useChatMessages();
  const { isBusy, error } = useChatActions();

  if (messages.length === 0) {
    return <ChatEmptyState />;
  }

  // Use isBusy (submitted OR streaming), not status === "streaming": the reply's first chunk
  // arrives ~200ms before the status flips, and in that gap it must already count as in progress.
  const lastMessage = messages.at(-1);
  const replyInProgress = isBusy && lastMessage?.role === "assistant";
  const streamingMessageId = replyInProgress ? lastMessage.id : undefined;
  const waitingForReply = isBusy && lastMessage?.role === "user";

  return (
    <MessageList messages={messages} streamingMessageId={streamingMessageId}>
      {waitingForReply && <PendingIndicator />}
      {error && <ChatError />}
    </MessageList>
  );
}
