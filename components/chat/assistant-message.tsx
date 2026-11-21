import { Message, MessageContent, MessageFooter } from "@/components/ui/message";
import type { ChatUIMessage } from "@/lib/chat/types";
import { CopyMessageButton } from "./copy-message-button";
import { MessagePart } from "./message-part";

type AssistantMessageProps = {
  message: ChatUIMessage;
  isStreaming: boolean;
};

/** No bubble: replies read like a page, which suits long explanations. */
export function AssistantMessage({ message, isStreaming }: AssistantMessageProps) {
  return (
    <Message align="start">
      <MessageContent>
        {message.parts.map((part, index) => (
          <MessagePart
            key={`${message.id}-${index}`}
            part={part}
            metadata={message.metadata}
            isStreaming={isStreaming}
          />
        ))}

        {/* Copying half a reply is useless, so actions appear once it's finished.
            No negative margins: the scroller item clips anything outside its box. */}
        {!isStreaming && (
          <MessageFooter className="px-0">
            <CopyMessageButton message={message} />
          </MessageFooter>
        )}
      </MessageContent>
    </Message>
  );
}
