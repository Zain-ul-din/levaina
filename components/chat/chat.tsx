import { Composer } from "./composer";
import { MessageListContainer } from "./message-list-container";

/**
 * Pure layout: reads no context, so it never re-renders during streaming.
 * The scroll area spans the full width (scrollbar at the window edge);
 * the content inside it is centred to a readable column.
 */
export function Chat() {
  return (
    <main className="flex h-dvh w-full flex-col">
      <div className="flex min-h-0 flex-1 flex-col">
        <MessageListContainer />
      </div>
      <div className="mx-auto w-full max-w-3xl px-4 pt-2 pb-4">
        <Composer />
      </div>
    </main>
  );
}
