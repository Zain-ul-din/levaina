import { Message, MessageContent, MessageFooter } from "@/components/ui/message";
import type { ChatUIMessage } from "@/lib/chat/types";
import { CopyMessageButton } from "./copy-message-button";
import { isBrainPart } from "@/lib/chat/brain";
import { Brain } from "./brain";
import { MessagePart } from "./message-part";

type AssistantMessageProps = {
  message: ChatUIMessage;
  isStreaming: boolean;
  /** Show which memories this reply was given (decided by the list, see used-memories.ts). */
  showUsedMemories?: boolean;
};

/** No bubble: replies read like a page, which suits long explanations. */
export function AssistantMessage({ message, isStreaming, showUsedMemories }: AssistantMessageProps) {
  // The coach's working (thinking, memory tools) goes into one Brain line; the answer follows.
  const brainParts = message.parts.filter(isBrainPart);
  const answerParts = message.parts.filter((part) => !isBrainPart(part));
  const hasAnswerText = answerParts.some((part) => part.type === "text" && part.text.trim());

  return (
    <Message align="start">
      <MessageContent>
        <Brain
          messageId={message.id}
          parts={brainParts}
          reasoningDurations={message.metadata?.reasoningDurations ?? []}
          usedMemories={showUsedMemories ? (message.metadata?.usedMemories ?? []) : []}
          isThinking={isStreaming && !hasAnswerText}
        />
        {answerParts.map((part, index) => (
          <MessagePart key={`${message.id}-${index}`} part={part} isStreaming={isStreaming} />
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
