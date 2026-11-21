import { getMemoryStore } from "@/lib/memory/get-memory-store";
import type { MemoriesResponse } from "@/lib/memory/memory-api";
import { getCurrentUserId } from "@/lib/server/current-user";

/** Everything the coach currently remembers about the user (the same list it sees). */
export async function GET() {
  const memories = await getMemoryStore().listActive(await getCurrentUserId());
  return Response.json({ memories } satisfies MemoriesResponse);
}
