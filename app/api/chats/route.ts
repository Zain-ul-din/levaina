import { CHAT_PAGE_SIZE, type ChatPageResponse } from "@/lib/chats/chat-api";
import { getChatStore } from "@/lib/chats/get-chat-store";
import { getCurrentUserId } from "@/lib/server/current-user";

/** One page of the signed-in user's chats, most recently active first. */
export async function GET(req: Request) {
  const before = new URL(req.url).searchParams.get("before") ?? undefined;
  if (before && Number.isNaN(Date.parse(before))) return Response.json({ error: "Invalid date." }, { status: 400 });

  const [store, userId] = await Promise.all([getChatStore(), getCurrentUserId()]);
  // One extra row tells us whether another page exists, without a second query.
  const rows = await store.list(userId, { limit: CHAT_PAGE_SIZE + 1, before });
  const chats = rows.slice(0, CHAT_PAGE_SIZE);
  const nextBefore = rows.length > CHAT_PAGE_SIZE ? chats.at(-1)!.updatedAt : null;

  return Response.json({ chats, nextBefore } satisfies ChatPageResponse);
}
