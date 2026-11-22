import { ToolChoiceViolationError } from "ai";

/**
 * The coach's first step is forced to call a tool (save, log, or noNewMemory), because without
 * the force it skipped saving about 1 turn in 3. About 1 turn in 20 the model ignores the force
 * and answers straight away; the AI SDK then ends the stream with a ToolChoiceViolationError,
 * after the answer has already streamed. Dropping that one error keeps the good answer: only that
 * turn's recording is skipped, the same as before the force existed. Every other error passes through.
 */
export function forgiveSkippedRecording<Part extends { type: string }>(stream: ReadableStream<Part>): ReadableStream<Part> {
  return stream.pipeThrough(
    new TransformStream<Part, Part>({
      transform(part, controller) {
        if (part.type === "error" && ToolChoiceViolationError.isInstance((part as { error?: unknown }).error)) {
          console.warn("Coach answered without recording first; nothing was saved or logged this turn.");
          return;
        }
        controller.enqueue(part);
      },
    }),
  );
}
