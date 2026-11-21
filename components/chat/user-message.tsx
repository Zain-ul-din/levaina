import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Message, MessageContent } from "@/components/ui/message";
import { getMessageText } from "@/lib/chat/get-message-text";
import type { ChatUIMessage } from "@/lib/chat/types";

type UserMessageProps = {
  message: ChatUIMessage;
};

/** People type plain text, so it's shown as-is in a bubble (no markdown). */
export function UserMessage({ message }: UserMessageProps) {
  return (
    <Message align="end">
      <MessageContent>
        <Bubble align="end" variant="muted">
          <BubbleContent className="whitespace-pre-wrap">
            {getMessageText(message)}
          </BubbleContent>
        </Bubble>
      </MessageContent>
    </Message>
  );
}
