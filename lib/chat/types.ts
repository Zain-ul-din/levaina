import type { LogTools } from "@/lib/ai/tools/log-tools";
import type { MemoryTools } from "@/lib/ai/tools/memory-tools";
import type { ResearchTools } from "@/lib/ai/tools/research-tools";
import type { Memory } from "@/lib/memory/types";
import type { InferUITools, UIMessage } from "ai";

/** Extra data the server attaches to each assistant message. */
export type ChatMessageMetadata = {
  /**
   * Milliseconds spent on each reasoning block, in order. A reply with tool calls has
   * several steps, and each step can reason, so one number per message isn't enough.
   */
  reasoningDurations?: number[];
  /** Snapshot of the memories the model was given for this reply. */
  usedMemories?: UsedMemory[];
};

/** The slice of a memory the chat shows; enough to list it, nothing more. */
export type UsedMemory = Pick<Memory, "id" | "kind" | "content" | "occurredOn">;

/** Every tool the chat agent can call; drives the typed `tool-*` message parts. */
export type ChatTools = InferUITools<MemoryTools & LogTools & ResearchTools>;

/**
 * A compaction marker, streamed as a `data-compaction` part at the top of the reply that
 * triggered it. "done" carries the running summary of everything up to `summarizedThrough`,
 * so the chat itself is the source of truth (and persists with the messages later).
 */
export type CompactionData =
  | { state: "running" }
  | { state: "done"; summary: string; summarizedThrough: string; foldedMessages: number }
  | { state: "failed" };

/** Custom `data-*` parts the server can stream into a message. */
export type ChatDataTypes = {
  compaction: CompactionData;
};

/** The one message type shared by the API route and the UI. */
export type ChatUIMessage = UIMessage<ChatMessageMetadata, ChatDataTypes, ChatTools>;

export type ChatMessagePart = ChatUIMessage["parts"][number];

/** Parts produced by the memory tools (saveMemory, updateMemory, forgetMemory). */
export type MemoryToolPart = Extract<
  ChatMessagePart,
  { type: "tool-saveMemory" | "tool-updateMemory" | "tool-forgetMemory" }
>;

/** The research search part (searchResearch). */
export type ResearchToolPart = Extract<ChatMessagePart, { type: "tool-searchResearch" }>;

/** Tool names that add an entry to the log. */
export const LOG_ADD_TOOL_TYPES = [
  "tool-logMeal",
  "tool-logSymptom",
  "tool-logStool",
  "tool-logWeight",
  "tool-logNote",
] as const;

/** Parts produced by the log tools (adding and removing entries). */
export type LogToolPart = Extract<
  ChatMessagePart,
  { type: (typeof LOG_ADD_TOOL_TYPES)[number] | "tool-removeLogEntry" }
>;
