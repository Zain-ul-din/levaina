import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerFade,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import type { ChatUIMessage } from "@/lib/chat/types";
import type { ReactNode } from "react";
import { messagesShowingUsedMemories } from "@/lib/chat/used-memories";
import { ChatMessage } from "./chat-message";

type MessageListProps = {
  messages: ChatUIMessage[];
  /** The assistant message currently being streamed, if any. */
  streamingMessageId?: string;
  /** Rendered after the last message (pending indicator, errors). */
  children?: ReactNode;
};

export function MessageList({ messages, streamingMessageId, children }: MessageListProps) {
  const showUsedMemoriesFor = messagesShowingUsedMemories(messages);

  return (
    <MessageScrollerProvider>
      <MessageScroller>
        <MessageScrollerViewport>
          {/* px-3/py-5 + the item's p-1 = 16px/24px, so text still lines up with the composer. */}
          <MessageScrollerContent className="mx-auto w-full max-w-3xl px-3 py-5">
            {messages.map((message) => (
              // Items use content-visibility, which clips anything painted outside them.
              // p-1 leaves room for focus rings and shadows (button ring-3 = 3px).
              // User messages are scroll anchors: on send, the scroller pins the new
              // message to the top and the reply streams in below it.
              <MessageScrollerItem
                key={message.id}
                messageId={message.id}
                scrollAnchor={message.role === "user"}
                className="p-1"
              >
                <ChatMessage
                  message={message}
                  isStreaming={message.id === streamingMessageId}
                  showUsedMemories={showUsedMemoriesFor.has(message.id)}
                />
              </MessageScrollerItem>
            ))}
            {children}
          </MessageScrollerContent>
        </MessageScrollerViewport>
        <MessageScrollerFade />
        <MessageScrollerButton />
      </MessageScroller>
    </MessageScrollerProvider>
  );
}
