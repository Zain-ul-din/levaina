import { Message, MessageContent } from "@/components/ui/message";
import { getMessageText } from "@/lib/chat/get-message-text";
import type { ChatUIMessage } from "@/lib/chat/types";

type UserMessageProps = {
  message: ChatUIMessage;
};

/** The person's message: a soft card bubble on the right, in body text (it's a message, not a headline). */
export function UserMessage({ message }: UserMessageProps) {
  return (
    <Message align="end">
      <MessageContent>
        <p className="max-w-[85%] self-end rounded-[1.4rem] rounded-br-md bg-card px-4 py-2.5 text-base leading-relaxed whitespace-pre-wrap shadow-soft">
          {getMessageText(message)}
        </p>
      </MessageContent>
    </Message>
  );
}
