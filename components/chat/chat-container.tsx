"use client";

import { Chat } from "./chat";
import { ChatProvider } from "./chat-provider";

/** Entry point: sets up the chat data once, then renders the UI that reads from it. */
export function ChatContainer() {
  return (
    <ChatProvider>
      <Chat />
    </ChatProvider>
  );
}
