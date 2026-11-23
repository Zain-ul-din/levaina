import { Message, MessageContent } from "@/components/ui/message";
import { getMessageText } from "@/lib/chat/get-message-text";
import type { ChatUIMessage } from "@/lib/chat/types";
import { cn } from "@/lib/utils";

type UserMessageProps = {
  message: ChatUIMessage;
  /** Just sent: rises in from the composer below (from its bottom-right corner, where it was typed). */
  isNew?: boolean;
};

/** The person's message: a soft card bubble on the right, in body text (it's a message, not a headline). */
export function UserMessage({ message, isNew = false }: UserMessageProps) {
  return (
    <Message align="end">
      <MessageContent>
        <p
          className={cn(
            "max-w-[85%] self-end rounded-[1.4rem] rounded-br-md bg-card px-4 py-2.5 text-base leading-relaxed whitespace-pre-wrap shadow-soft",
            isNew &&
              "origin-bottom-right transition-[opacity,transform] duration-300 ease-(--ease-out) starting:translate-y-3 starting:scale-[0.97] starting:opacity-0 motion-reduce:starting:translate-y-0 motion-reduce:starting:scale-100",
          )}
        >
          {getMessageText(message)}
        </p>
      </MessageContent>
    </Message>
  );
}
