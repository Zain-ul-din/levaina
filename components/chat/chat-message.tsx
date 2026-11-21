import { Bubble } from "@/components/ui/bubble";
import {
  Message,
  MessageContent,
  MessageFooter,
} from "@/components/ui/message";
import type { ChatUIMessage } from "@/lib/chat/types";
import { CopyMessageButton } from "./copy-message-button";
import { MessagePart } from "./message-part";

type ChatMessageProps = {
  message: ChatUIMessage;
};

export function ChatMessage({ message }: ChatMessageProps) {
  const isAssistant = message.role === "assistant";
  const align = isAssistant ? "start" : "end";

  return (
    <Message align={align}>
      <MessageContent>
        <Bubble align={align} variant="muted">
          {message.parts.map((part, index) => (
            <MessagePart
              key={`${message.id}-${index}`}
              part={part}
              metadata={message.metadata}
            />
          ))}
        </Bubble>

        {isAssistant && (
          <MessageFooter>
            <CopyMessageButton message={message} />
          </MessageFooter>
        )}
      </MessageContent>
    </Message>
  );
}
