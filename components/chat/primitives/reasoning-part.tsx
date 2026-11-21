import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
} from "@/components/ui/trace";
import { ThinkingLine } from "./thinking-line";

type ReasoningPartProps = {
  text: string;
  isStreaming: boolean;
  durationMs?: number;
};

export function ReasoningPart({ text, isStreaming, durationMs }: ReasoningPartProps) {
  return (
    <Trace>
      <TraceCollapsible>
        <TraceCollapsibleTrigger>
          <ThinkingLine isThinking={isStreaming} durationMs={durationMs} />
        </TraceCollapsibleTrigger>
        <TraceCollapsibleContent className="whitespace-pre-wrap">
          {text}
        </TraceCollapsibleContent>
      </TraceCollapsible>
    </Trace>
  );
}
