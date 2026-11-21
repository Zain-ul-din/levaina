import { Composer } from "./composer";
import { MessageListContainer } from "./message-list-container";

/** Pure layout: reads no context, so it never re-renders during streaming. */
export function Chat() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-8 p-4">
      <MessageListContainer />
      <Composer />
    </main>
  );
}
