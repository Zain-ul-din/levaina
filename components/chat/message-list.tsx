import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import type { ChatUIMessage } from "@/lib/chat/types";
import type { ReactNode } from "react";
import { ChatMessage } from "./chat-message";

type MessageListProps = {
  messages: ChatUIMessage[];
  /** The assistant message currently being streamed, if any. */
  streamingMessageId?: string;
  /** Rendered after the last message (pending indicator, errors). */
  children?: ReactNode;
};

export function MessageList({ messages, streamingMessageId, children }: MessageListProps) {
  return (
    <MessageScrollerProvider>
      <MessageScroller>
        <MessageScrollerViewport>
          <MessageScrollerContent className="py-6">
            {messages.map((message) => (
              <MessageScrollerItem key={message.id}>
                <ChatMessage
                  message={message}
                  isStreaming={message.id === streamingMessageId}
                />
              </MessageScrollerItem>
            ))}
            {children}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerButton />
      </MessageScroller>
    </MessageScrollerProvider>
  );
}
