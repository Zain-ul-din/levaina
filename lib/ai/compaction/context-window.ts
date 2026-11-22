import type { ChatMessagePart, ChatUIMessage, CompactionData } from "@/lib/chat/types";

/** Tuning knobs, in one place. Tokens are estimated (~4 characters each), which is close enough to decide when. */
export const COMPACTION = {
  /** Compact once the messages we'd send are estimated above this. */
  triggerTokens: 30_000,
  /** Always keep at least this many latest messages word for word. */
  keepRecentMessages: 6,
  /** Thinking and tool calls are kept only in this many latest messages; older ones are pruned. */
  keepWorkMessages: 4,
} as const;

type DoneCompaction = Extract<CompactionData, { state: "done" }>;

/** The newest finished compaction in the chat, if any. */
export function latestCompaction(messages: ChatUIMessage[]): DoneCompaction | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    for (const part of messages[i].parts) {
      if (part.type === "data-compaction" && part.data.state === "done") return part.data;
    }
  }
  return null;
}

/** Messages after the one with `id` (all of them if it isn't found). */
export function messagesAfter(messages: ChatUIMessage[], id: string): ChatUIMessage[] {
  const index = messages.findIndex((message) => message.id === id);
  return index === -1 ? messages : messages.slice(index + 1);
}

const isWork = (part: ChatMessagePart) =>
  part.type === "reasoning" || part.type === "dynamic-tool" || part.type.startsWith("tool-");
const isData = (part: ChatMessagePart) => part.type.startsWith("data-");

/**
 * What the model actually needs to see. Old thinking and memory tool calls are dropped (the facts
 * already live in memory), and data parts are UI-only. Messages left empty are dropped too.
 */
export function pruneForModel(messages: ChatUIMessage[], keepWorkMessages: number = COMPACTION.keepWorkMessages) {
  const firstWithWork = messages.length - keepWorkMessages;
  return messages
    .map((message, index) => ({
      ...message,
      parts: message.parts.filter((part) => !isData(part) && (index >= firstWithWork || !isWork(part))),
    }))
    .filter((message) => message.parts.length > 0);
}

export function estimateTokens(messages: ChatUIMessage[]): number {
  return Math.ceil(JSON.stringify(messages.map((message) => message.parts)).length / 4);
}

/**
 * Decides whether to fold older messages into the summary. Returns the split, or null if the
 * window is small enough. The kept part always starts at a user message, so a turn is never cut in half.
 */
export function planCompaction(window: ChatUIMessage[], options: Partial<typeof COMPACTION> = {}) {
  const { triggerTokens, keepRecentMessages } = { ...COMPACTION, ...options };
  if (estimateTokens(pruneForModel(window)) < triggerTokens) return null;

  let cut = window.length - keepRecentMessages;
  while (cut > 0 && window[cut].role !== "user") cut--;
  if (cut <= 0) return null;

  return { fold: window.slice(0, cut), keep: window.slice(cut) };
}
