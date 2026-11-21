import { model } from "@/lib/ai/models";
import { buildSystemInstructions } from "@/lib/ai/system-instructions";
import { createMemoryTools } from "@/lib/ai/tools/memory-tools";
import type { ChatMessageMetadata, ChatUIMessage } from "@/lib/chat/types";
import { getMemoryStore } from "@/lib/memory/get-memory-store";
import { getCurrentUserId } from "@/lib/server/current-user";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
} from "ai";

/** Tool call → tool result → more text counts as steps; this caps runaway tool loops. */
const MAX_STEPS = 5;

export async function POST(req: Request) {
  const { messages }: { messages: ChatUIMessage[] } = await req.json();

  const userId = await getCurrentUserId();
  const store = getMemoryStore();
  const tools = createMemoryTools({ store, userId });
  const memories = await store.listActive(userId);

  const result = streamText({
    model,
    instructions: buildSystemInstructions({ now: new Date(), memories }),
    messages: await convertToModelMessages(messages, { tools }),
    tools,
    stopWhen: isStepCount(MAX_STEPS),
  });

  let reasoningStartedAt = 0;
  const reasoningDurations: number[] = [];

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      originalMessages: messages,
      stream: result.stream,
      messageMetadata: ({ part }): ChatMessageMetadata | undefined => {
        if (part.type === "start" && memories.length > 0) {
          return {
            usedMemories: memories.map(({ id, kind, content, occurredOn }) => ({ id, kind, content, occurredOn })),
          };
        }
        if (part.type === "reasoning-start") {
          reasoningStartedAt = Date.now();
        } else if (part.type === "reasoning-end") {
          reasoningDurations.push(Date.now() - reasoningStartedAt);
          return { reasoningDurations: [...reasoningDurations] };
        }
      },
    }),
  });
}
