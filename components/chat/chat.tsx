"use client";

import { useChatContext } from "./chat-provider";
import { Composer } from "./composer";
import { MessageList } from "./message-list";

export function Chat() {
  const { messages } = useChatContext();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-8 p-4">
      <MessageList messages={messages} />
      <Composer />
    </main>
  );
}
