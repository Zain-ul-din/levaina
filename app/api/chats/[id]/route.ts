import { getChatStore } from "@/lib/chats/get-chat-store";
import { isValidChatId } from "@/lib/chat/request";
import { getCurrentUserId } from "@/lib/server/current-user";

/** Deletes one chat and all its messages, for good. */
export async function DELETE(_req: Request, { params }: RouteContext<"/api/chats/[id]">) {
  const { id } = await params;
  if (!isValidChatId(id)) return Response.json({ error: "Invalid chat id." }, { status: 400 });

  const removed = await (await getChatStore()).remove(await getCurrentUserId(), id);
  if (!removed) return Response.json({ error: "That chat doesn't exist or was already deleted." }, { status: 404 });
  return new Response(null, { status: 204 });
}
