import { getLogStore } from "@/lib/log/get-log-store";
import { getCurrentUserId } from "@/lib/server/current-user";

/** Deletes one log entry (Undo on the chat chip, delete in the log sheet). */
export async function DELETE(_req: Request, { params }: RouteContext<"/api/log/[id]">) {
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return Response.json({ error: "Invalid log entry id." }, { status: 400 });
  }

  const removed = await (await getLogStore()).remove(await getCurrentUserId(), id);
  if (!removed) {
    return Response.json({ error: "That entry doesn't exist or was already removed." }, { status: 404 });
  }
  return new Response(null, { status: 204 });
}
