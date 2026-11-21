import {
  MessageScroller,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
import type { ChatUIMessage } from "@/lib/chat/types";
import { ChatMessage } from "./chat-message";

type MessageListProps = {
  messages: ChatUIMessage[];
};

export function MessageList({ messages }: MessageListProps) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <MessageScrollerProvider>
        <MessageScroller>
          <MessageScrollerViewport>
            <MessageScrollerContent>
              {messages.map((message) => (
                <MessageScrollerItem key={message.id}>
                  <ChatMessage message={message} />
                </MessageScrollerItem>
              ))}
            </MessageScrollerContent>
          </MessageScrollerViewport>
        </MessageScroller>
      </MessageScrollerProvider>
    </div>
  );
}
