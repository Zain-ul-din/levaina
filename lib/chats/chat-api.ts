/** Browser-side calls to the chats API, and the response shape shared with the route. */
import type { ChatSummary } from "./chat-store";

/** How many chats one page of the list holds. */
export const CHAT_PAGE_SIZE = 40;

/** Body of GET /api/chats. */
export type ChatPageResponse = {
  chats: ChatSummary[];
  /** Pass as `before` to get the next page; null when there are no older chats. */
  nextBefore: string | null;
};

export async function fetchChatsRequest(before?: string, signal?: AbortSignal): Promise<ChatPageResponse> {
  const query = before ? `?before=${encodeURIComponent(before)}` : "";
  const response = await fetch(`/api/chats${query}`, { signal });
  if (!response.ok) throw new Error("Couldn't load your chats. Try again.");
  return (await response.json()) as ChatPageResponse;
}

export async function deleteChatRequest(id: string): Promise<void> {
  const response = await fetch(`/api/chats/${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Couldn't delete that chat. Try again.");
}
