import type { ChatUIMessage } from "./types";

/**
 * Which assistant messages should show the "Using N memories" line:
 * the first reply that had memories, then again only when the set changed.
 * Showing it on every reply would repeat the same line all conversation long.
 */
export function messagesShowingUsedMemories(messages: ChatUIMessage[]): Set<string> {
  const ids = new Set<string>();
  let previous = "";

  for (const message of messages) {
    const used = message.role === "assistant" ? message.metadata?.usedMemories : undefined;
    if (!used?.length) continue;

    const signature = used.map((memory) => memory.id).join(",");
    if (signature !== previous) ids.add(message.id);
    previous = signature;
  }
  return ids;
}
