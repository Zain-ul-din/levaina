import type { Memory } from "./types";

/** Response body of GET /api/memories, shared by the route and the client. */
export type MemoriesResponse = { memories: Memory[] };

/** Browser-side calls to the memory API. */
export async function fetchMemoriesRequest(signal?: AbortSignal): Promise<Memory[]> {
  const response = await fetch("/api/memories", { signal });
  if (!response.ok) throw new Error("Couldn't load your memories. Try again.");
  return ((await response.json()) as MemoriesResponse).memories;
}

/** Soft-deletes one memory (used by Undo on the chat chip and by the memories sheet). */
export async function forgetMemoryRequest(id: number): Promise<void> {
  const response = await fetch(`/api/memories/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Couldn't remove that memory. Try again.");
}
