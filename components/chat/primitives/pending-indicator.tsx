import { Trace } from "@/components/ui/trace";
import { ThinkingLine } from "./thinking-line";

/** Fills the gap between sending and the first streamed token. */
export function PendingIndicator() {
  return (
    <Trace aria-live="polite">
      <ThinkingLine isThinking />
    </Trace>
  );
}
