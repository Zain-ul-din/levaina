import { buildConversationContext } from "@/lib/ai/compaction/build-context";
import { createChatAgent } from "@/lib/ai/chat-agent";
import { forgiveSkippedRecording } from "@/lib/ai/forgive-skipped-recording";
import { titleFromMessage } from "@/lib/chats/chat-store";
import { getChatStore } from "@/lib/chats/get-chat-store";
import { parseChatRequest, resolveTimeZone } from "@/lib/chat/request";
import type { ChatMessageMetadata, ChatUIMessage } from "@/lib/chat/types";
import { getMemoryStore } from "@/lib/memory/get-memory-store";
import { getCurrentUserId } from "@/lib/server/current-user";
import {
  consumeStream,
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
  const body = parseChatRequest(await req.json().catch(() => null));
  if (!body) return Response.json({ error: "Invalid chat request" }, { status: 400 });
  const { id: chatId, message } = body;

  const [userId, store, chatStore] = await Promise.all([getCurrentUserId(), getMemoryStore(), getChatStore()]);
  const [stored, memories] = await Promise.all([chatStore.load(userId, chatId), store.listActive(userId)]);

  // The server owns the history. A message it already has (retry, regenerate) replaces itself and what followed.
  const history = stored ?? [];
  const existing = history.findIndex((saved) => saved.id === message.id);
  const from = existing === -1 ? history.length : existing;
  const messages = [...history.slice(0, from), message];

  // Server clock (trustworthy) shown in the device's zone (what the user lives in).
  const now = new Date();
  const timeZone = resolveTimeZone(body.timeZone);

  const stream = createUIMessageStream<ChatUIMessage>({
    originalMessages: messages,
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
        // Stop button: stop generating (and save what was written so far).
        abortSignal: req.signal,
      });

      let reasoningStartedAt = 0;
      const reasoningDurations: number[] = [];

      writer.merge(
        toUIMessageStream({
          stream: forgiveSkippedRecording(result.stream),
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
    // Runs when the reply ends, finished or stopped: save the user's message and the reply as one turn.
    onEnd: async ({ responseMessage }) => {
      const hasReply = responseMessage.parts.some((part) => part.type !== "step-start");
      try {
        await chatStore.saveMessages(userId, chatId, {
          from,
          messages: hasReply ? [message, responseMessage] : [message],
          title: from === 0 ? titleFromMessage(message) : undefined,
        });
      } catch (error) {
        console.error("Saving the chat failed", error);
      }
    },
  });

  return createUIMessageStreamResponse({
    stream,
    // Keep reading even if the device disconnects, so onEnd still runs and the turn is saved.
    consumeSseStream: ({ stream }) => consumeStream({ stream }),
  });
}
