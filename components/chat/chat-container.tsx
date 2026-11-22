"use client";

import type { ChatUIMessage } from "@/lib/chat/types";
import { Chat } from "./chat";
import { ChatProvider } from "./chat-provider";

type ChatContainerProps = {
  /** A saved chat to reopen; omit for a new one. */
  chatId?: string;
  initialMessages?: ChatUIMessage[];
};

/** Entry point: sets up the chat data once, then renders the UI that reads from it. */
export function ChatContainer({ chatId, initialMessages }: ChatContainerProps) {
  return (
    <ChatProvider chatId={chatId} initialMessages={initialMessages}>
      <Chat />
    </ChatProvider>
  );
}
