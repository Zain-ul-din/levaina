import { getMemoryStore } from "@/lib/memory/get-memory-store";
import { getCurrentUserId } from "@/lib/server/current-user";

/** Undo for a saved memory: soft-deletes it (status = forgotten). */
export async function DELETE(_req: Request, { params }: RouteContext<"/api/memories/[id]">) {
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) {
    return Response.json({ error: "Invalid memory id." }, { status: 400 });
  }

  const forgotten = await getMemoryStore().forget(await getCurrentUserId(), id);
  if (!forgotten) {
    return Response.json({ error: "That memory doesn't exist or was already removed." }, { status: 404 });
  }
  return new Response(null, { status: 204 });
}
