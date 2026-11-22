import "server-only";
import { getSupabaseSessionClient } from "@/lib/supabase/session-client";
import type { MemoryStore } from "./memory-store";
import { SupabaseMemoryStore } from "./supabase-memory-store";

/** Composition root for memory storage: the only file that picks the implementation. */
export async function getMemoryStore(): Promise<MemoryStore> {
  return new SupabaseMemoryStore(await getSupabaseSessionClient());
}
