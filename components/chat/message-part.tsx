import type { ChatMessagePart } from "@/lib/chat/types";
import { MemoryPart } from "./primitives/memory-part";
import { ReasoningPart } from "./primitives/reasoning-part";
import { TextPart } from "./primitives/text-part";

type MessagePartProps = {
  part: ChatMessagePart;
  isStreaming: boolean;
  /** For reasoning parts: how long that block took, if known. */
  reasoningDurationMs?: number;
};

/**
 * Picks the primitive for one assistant message part.
 * New part types (tool calls, plan cards, files) get a new `case` and a new primitive.
 */
export function MessagePart({ part, isStreaming, reasoningDurationMs }: MessagePartProps) {
  switch (part.type) {
    case "text":
      return <TextPart text={part.text} isStreaming={isStreaming} />;
    case "reasoning":
      // Steps after a tool call often "reason" with no text; an empty "Thought" line is noise.
      if (part.state !== "streaming" && !part.text.trim()) return null;
      return (
        <ReasoningPart
          text={part.text}
          isStreaming={part.state === "streaming"}
          durationMs={reasoningDurationMs}
        />
      );
    case "tool-saveMemory":
    case "tool-updateMemory":
    case "tool-forgetMemory":
      return <MemoryPart part={part} />;
    default:
      // step-start and part types we don't render yet.
      return null;
  }
}
