import type { MemoryTools } from "@/lib/ai/tools/memory-tools";
import type { Memory } from "@/lib/memory/types";
import type { InferUITools, UIDataTypes, UIMessage } from "ai";

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
export type ChatTools = InferUITools<MemoryTools>;

/** The one message type shared by the API route and the UI. */
export type ChatUIMessage = UIMessage<ChatMessageMetadata, UIDataTypes, ChatTools>;

export type ChatMessagePart = ChatUIMessage["parts"][number];

/** Parts produced by the memory tools (saveMemory, updateMemory, forgetMemory). */
export type MemoryToolPart = Extract<
  ChatMessagePart,
  { type: "tool-saveMemory" | "tool-updateMemory" | "tool-forgetMemory" }
>;
