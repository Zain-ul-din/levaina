import { model } from "@/lib/ai/models";
import type { ChatMessageMetadata, ChatUIMessage } from "@/lib/chat/types";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
} from "ai";

export async function POST(req: Request) {
  const { messages }: { messages: ChatUIMessage[] } = await req.json();

  const result = streamText({
    model,
    instructions: "You are an helpful assistant",
    messages: await convertToModelMessages(messages),
  });

  let reasoningStartedAt = 0;

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      originalMessages: messages,
      stream: result.stream,
      messageMetadata: ({ part }): ChatMessageMetadata | undefined => {
        if (part.type === "reasoning-start") {
          reasoningStartedAt = Date.now();
        } else if (part.type === "reasoning-end") {
          return { reasoningDuration: Date.now() - reasoningStartedAt };
        }
      },
    }),
  });
}
