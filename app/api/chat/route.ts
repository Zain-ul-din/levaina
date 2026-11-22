import { buildConversationContext } from "@/lib/ai/compaction/build-context";
import { createChatAgent } from "@/lib/ai/chat-agent";
import { resolveTimeZone, type ChatRequestBody } from "@/lib/chat/request";
import type { ChatMessageMetadata, ChatUIMessage } from "@/lib/chat/types";
import { getMemoryStore } from "@/lib/memory/get-memory-store";
import { getCurrentUserId } from "@/lib/server/current-user";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
  streamText,
  toUIMessageStream,
} from "ai";

/** One id, so "running" and "done" update the same divider instead of adding a second one. */
const COMPACTION_PART_ID = "compaction";

export async function POST(req: Request) {
  const { messages, timeZone: requestedZone }: ChatRequestBody = await req.json();

  const userId = await getCurrentUserId();
  const store = getMemoryStore();
  const memories = await store.listActive(userId);
  // Server clock (trustworthy) shown in the device's zone (what the user lives in).
  const now = new Date();
  const timeZone = resolveTimeZone(requestedZone);

  const stream = createUIMessageStream<ChatUIMessage>({
    execute: async ({ writer }) => {
      // "start" names the reply, so it must come before anything else: a compaction part sent
      // earlier would land in a temporary message, and the client would render the reply twice.
      writer.write({
        type: "start",
        messageId: generateId(),
        messageMetadata:
          memories.length > 0
            ? { usedMemories: memories.map(({ id, kind, content, occurredOn }) => ({ id, kind, content, occurredOn })) }
            : undefined,
      });

      const context = await buildConversationContext({
        messages,
        memories,
        now,
        timeZone,
        onCompaction: (data) => writer.write({ type: "data-compaction", id: COMPACTION_PART_ID, data }),
      });

      const { tools, settings } = await createChatAgent({
        store,
        userId,
        timeZone,
        now,
        memories,
        conversationSummary: context.summary,
      });
      const result = streamText({
        ...settings,
        messages: await convertToModelMessages(context.messages, { tools }),
      });

      let reasoningStartedAt = 0;
      const reasoningDurations: number[] = [];

      writer.merge(
        toUIMessageStream({
          originalMessages: messages,
          stream: result.stream,
          sendStart: false, // already sent above
          messageMetadata: ({ part }): ChatMessageMetadata | undefined => {
            if (part.type === "reasoning-start") {
              reasoningStartedAt = Date.now();
            } else if (part.type === "reasoning-end") {
              reasoningDurations.push(Date.now() - reasoningStartedAt);
              return { reasoningDurations: [...reasoningDurations] };
            }
          },
        }),
      );
    },
  });

  return createUIMessageStreamResponse({ stream });
}
