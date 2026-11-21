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
          {/* px-3/py-5 + the item's p-1 = 16px/24px, so text still lines up with the composer. */}
          <MessageScrollerContent className="mx-auto w-full max-w-3xl px-3 py-5">
            {messages.map((message) => (
              // Items use content-visibility, which clips anything painted outside them.
              // p-1 leaves room for focus rings and shadows (button ring-3 = 3px).
              <MessageScrollerItem key={message.id} className="p-1">
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
