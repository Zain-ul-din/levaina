import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceDescription,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from "@/components/ui/trace";
import { describeBrain, summarizeBrain } from "@/lib/chat/brain";
import type { ChatMessagePart, UsedMemory } from "@/lib/chat/types";
import { BrainIcon } from "@phosphor-icons/react";
import { MessagePart } from "./message-part";
import { UsedMemoriesPart } from "./primitives/used-memories-part";

type BrainProps = {
  messageId: string;
  /** Thinking and tool parts, in the order they happened. */
  parts: ChatMessagePart[];
  reasoningDurations: number[];
  /** Memories shown for this reply (empty when the list decided not to repeat them). */
  usedMemories: UsedMemory[];
  /** True while the coach is still working and no answer text has arrived yet. */
  isThinking: boolean;
};

/**
 * Everything the coach did before answering (memories it used, its thinking, what it saved),
 * folded into one quiet line. Expanding it shows the same items as before, Undo included.
 */
export function Brain({ messageId, parts, reasoningDurations, usedMemories, isThinking }: BrainProps) {
  const summary = summarizeBrain(parts, reasoningDurations, usedMemories);
  if (!summary.hasContent && !isThinking) return null;

  const description = describeBrain(summary);
  let reasoningIndex = 0;

  return (
    <Trace>
      <TraceCollapsible>
        <TraceCollapsibleTrigger>
          <TraceLine status={isThinking ? "running" : undefined}>
            <TraceIcon>
              <BrainIcon />
            </TraceIcon>
            <TraceTitle>{isThinking ? "Thinking" : "Brain"}</TraceTitle>
            {!isThinking && description && <TraceDescription>{description}</TraceDescription>}
          </TraceLine>
        </TraceCollapsibleTrigger>
        <TraceCollapsibleContent>
          <div className="flex flex-col gap-2 py-0.5">
            {usedMemories.length > 0 && <UsedMemoriesPart memories={usedMemories} />}
            {parts.map((part, index) => (
              <MessagePart
                key={`${messageId}-brain-${index}`}
                part={part}
                isStreaming={isThinking}
                reasoningDurationMs={part.type === "reasoning" ? reasoningDurations[reasoningIndex++] : undefined}
              />
            ))}
          </div>
        </TraceCollapsibleContent>
      </TraceCollapsible>
    </Trace>
  );
}
