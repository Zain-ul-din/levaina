import { Composer } from "./composer";
import { MessageListContainer } from "./message-list-container";

/** Pure layout: reads no context, so it never re-renders during streaming. */
export function Chat() {
  return (
    <main className="mx-auto flex h-dvh w-full max-w-3xl flex-col px-4">
      <div className="flex min-h-0 flex-1 flex-col">
        <MessageListContainer />
      </div>
      <div className="pt-2 pb-4">
        <Composer />
      </div>
    </main>
  );
}
