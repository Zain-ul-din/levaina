"use client";

import { useChatActions, useChatMessages } from "./chat-provider";
import { ChatEmptyState } from "./chat-empty-state";
import { ChatError } from "./chat-error";
import { MessageList } from "./message-list";
import { PendingIndicator } from "./primitives/pending-indicator";
import { useState } from "react";

/** Connects chat state to the list. The only component that re-renders on every streamed chunk. */
export function MessageListContainer() {
  const messages = useChatMessages();
  const { isBusy, error } = useChatActions();
  // Snapshot of what the chat opened with, taken here (not in MessageList, which only mounts once
  // there's a message): those don't animate, only messages sent from now on rise in.
  const [openedWith] = useState(() => new Set(messages.map((message) => message.id)));

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
    <MessageList messages={messages} openedWith={openedWith} streamingMessageId={streamingMessageId}>
      {waitingForReply && <PendingIndicator />}
      {error && <ChatError />}
    </MessageList>
  );
}
