import { ChatHeader } from "./chat-header";
import { Composer } from "./composer";
import { MessageListContainer } from "./message-list-container";

/**
 * App shell for the chat: header, scrolling messages, composer.
 * Pure layout apart from the header (which only reads rarely-changing actions),
 * so it never re-renders during streaming.
 * The scroll area spans the full width (scrollbar at the window edge);
 * the content inside it is centred to a readable column.
 */
export function Chat() {
  return (
    <main className="flex h-dvh w-full flex-col">
      <ChatHeader />
      <div className="flex min-h-0 flex-1 flex-col">
        <MessageListContainer />
      </div>
      {/* Bottom padding grows to clear the iPhone home bar; sides clear the notch in landscape. */}
      <div className="mx-auto w-full max-w-3xl px-[max(1rem,env(safe-area-inset-left))] pt-2 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <Composer />
      </div>
    </main>
  );
}
