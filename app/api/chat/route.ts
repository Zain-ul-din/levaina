import { createChatAgent } from "@/lib/ai/chat-agent";
import { resolveTimeZone, type ChatRequestBody } from "@/lib/chat/request";
import type { ChatMessageMetadata } from "@/lib/chat/types";
import { getMemoryStore } from "@/lib/memory/get-memory-store";
import { getCurrentUserId } from "@/lib/server/current-user";
import { convertToModelMessages, createUIMessageStreamResponse, streamText, toUIMessageStream } from "ai";

export async function POST(req: Request) {
  const { messages, timeZone }: ChatRequestBody = await req.json();

  // Server clock (trustworthy) shown in the device's zone (what the user lives in).
  const { memories, tools, settings } = await createChatAgent({
    store: getMemoryStore(),
    userId: await getCurrentUserId(),
    timeZone: resolveTimeZone(timeZone),
  });

  const result = streamText({
    ...settings,
    messages: await convertToModelMessages(messages, { tools }),
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
