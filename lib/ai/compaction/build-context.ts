import type { ChatUIMessage, CompactionData } from "@/lib/chat/types";
import type { Memory } from "@/lib/memory/types";
import { latestCompaction, messagesAfter, planCompaction, pruneForModel } from "./context-window";
import { summarizeConversation } from "./summarize-conversation";

type BuildContextOptions = {
  messages: ChatUIMessage[];
  memories: Memory[];
  now: Date;
  timeZone: string;
  /** Reports compaction progress, so the UI can show the divider while it runs. */
  onCompaction: (data: CompactionData) => void;
};

/**
 * What the coach sees this turn: the chat's running summary plus the messages after it.
 * If those have grown too big, older ones are folded into the summary first.
 */
export async function buildConversationContext({ messages, memories, now, timeZone, onCompaction }: BuildContextOptions) {
  const previous = latestCompaction(messages);
  let summary = previous?.summary ?? null;
  let window = previous ? messagesAfter(messages, previous.summarizedThrough) : messages;

  const plan = planCompaction(window);
  if (plan) {
    onCompaction({ state: "running" });
    try {
      summary = await summarizeConversation({ previousSummary: summary, messages: plan.fold, memories, now, timeZone });
      window = plan.keep;
      onCompaction({
        state: "done",
        summary,
        summarizedThrough: plan.fold.at(-1)!.id,
        foldedMessages: plan.fold.length,
      });
    } catch (error) {
      // Not fatal: this turn just goes out uncompacted, and the next one tries again.
      console.error("Compaction failed", error);
      onCompaction({ state: "failed" });
    }
  }

  return { summary, messages: pruneForModel(window) };
}
