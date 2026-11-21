"use client";

import { useChatMessages } from "./chat-provider";
import { MessageList } from "./message-list";

/** The only component that re-renders on every streamed chunk. */
export function MessageListContainer() {
  const messages = useChatMessages();
  return <MessageList messages={messages} />;
}
