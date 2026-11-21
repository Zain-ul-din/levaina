import {
  TraceDescription,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from "@/components/ui/trace";
import { CheckCircleIcon } from "@phosphor-icons/react";

type ThinkingLineProps = {
  isThinking: boolean;
  durationMs?: number;
};

/** One line shared by the pending indicator and reasoning parts, so both look identical. */
export function ThinkingLine({ isThinking, durationMs }: ThinkingLineProps) {
  if (isThinking) {
    return (
      <TraceLine status="running">
        <TraceTitle>Thinking</TraceTitle>
      </TraceLine>
    );
  }

  return (
    <TraceLine>
      <TraceIcon>
        <CheckCircleIcon />
      </TraceIcon>
      <TraceTitle>Thought</TraceTitle>
      {durationMs !== undefined && (
        <TraceDescription>{(durationMs / 1000).toFixed(1)}s</TraceDescription>
      )}
    </TraceLine>
  );
}
