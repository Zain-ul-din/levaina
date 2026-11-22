import { formatNow } from "@/lib/ai/format-now";
import { summaryModel } from "@/lib/ai/models";
import { stripAskTags } from "@/lib/chat/ask-tag";
import type { ChatUIMessage } from "@/lib/chat/types";
import { formatMemories } from "@/lib/memory/format-memories";
import type { Memory } from "@/lib/memory/types";
import { generateText } from "ai";

const instructions = `
You keep the running summary of a chat between a gut-and-weight coach and a user. Older messages are being removed from the coach's view, so your summary is all the coach will know about them.

Merge the previous summary (if any) with the new messages into one updated summary. Keep:
- Advice the coach already gave, specifically (foods, amounts, timings), so it isn't repeated.
- What the user agreed to try, started, or reported back, and how it went, with absolute dates when known.
- Questions the coach asked that the user hasn't answered yet.
- The plan in progress, if there is one, and the next step.

Leave out facts about the user that are already in "Saved memories" (weight, diagnosis, goals), small talk, and anything later corrected or replaced.

Write short bullet points under these headings, skipping any that are empty: "Advice given", "Agreed and tried", "Open questions", "Plan". Stay under 250 words. Write in the language of the chat. Output only the summary.
`.trim();

type SummarizeOptions = {
  previousSummary: string | null;
  /** The messages being folded into the summary, oldest first. */
  messages: ChatUIMessage[];
  memories: Memory[];
  now: Date;
  timeZone: string;
};

/** Plain transcript of what was said; thinking and tool calls are left out. */
function transcript(messages: ChatUIMessage[]) {
  return messages
    .map((message) => {
      const text = message.parts
        .filter((part) => part.type === "text")
        .map((part) => stripAskTags(part.text))
        .join("\n")
        .trim();
      return text && `${message.role === "user" ? "User" : "Coach"}: ${text}`;
    })
    .filter(Boolean)
    .join("\n\n");
}

/** A separate model call with its own prompt: turns old messages into the chat's running summary. */
export async function summarizeConversation({ previousSummary, messages, memories, now, timeZone }: SummarizeOptions) {
  const { text } = await generateText({
    model: summaryModel,
    instructions,
    prompt: [
      `Today is ${formatNow(now, timeZone)}.`,
      `# Saved memories\n\n${formatMemories(memories)}`,
      `# Previous summary\n\n${previousSummary ?? "(none yet)"}`,
      `# New messages to fold in\n\n${transcript(messages)}`,
    ].join("\n\n"),
  });
  return text.trim();
}
