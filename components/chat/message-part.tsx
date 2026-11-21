import type { ChatMessageMetadata, ChatMessagePart } from "@/lib/chat/types";
import { ReasoningPart } from "./primitives/reasoning-part";
import { TextPart } from "./primitives/text-part";

type MessagePartProps = {
  part: ChatMessagePart;
  metadata?: ChatMessageMetadata;
};

/**
 * Picks the primitive for one message part.
 * New part types (tool calls, plan cards, files) get a new `case` and a new primitive.
 */
export function MessagePart({ part, metadata }: MessagePartProps) {
  switch (part.type) {
    case "text":
      return <TextPart text={part.text} />;
    case "reasoning":
      return (
        <ReasoningPart
          text={part.text}
          isStreaming={part.state === "streaming"}
          durationMs={metadata?.reasoningDuration}
        />
      );
    default:
      // step-start and part types we don't render yet.
      return null;
  }
}
