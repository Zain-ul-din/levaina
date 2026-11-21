import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from "@/components/ui/trace";
import { CheckCircleIcon, SpinnerIcon } from "@phosphor-icons/react";

type ReasoningPartProps = {
  text: string;
  isStreaming: boolean;
  durationMs?: number;
};

export function ReasoningPart({ text, isStreaming, durationMs }: ReasoningPartProps) {
  return (
    <Trace className="mb-2">
      <TraceCollapsible>
        <TraceCollapsibleTrigger>
          <TraceLine>
            <TraceIcon>
              {isStreaming ? <SpinnerIcon className="animate-spin" /> : <CheckCircleIcon />}
            </TraceIcon>
            <TraceTitle>{isStreaming ? "Thinking..." : formatThoughtFor(durationMs)}</TraceTitle>
          </TraceLine>
        </TraceCollapsibleTrigger>
        <TraceCollapsibleContent className="whitespace-pre-wrap">{text}</TraceCollapsibleContent>
      </TraceCollapsible>
    </Trace>
  );
}

function formatThoughtFor(durationMs?: number) {
  if (durationMs === undefined) return "Thought";
  return `Thought for ${(durationMs / 1000).toFixed(1)}s`;
}
