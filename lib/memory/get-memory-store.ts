import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import type { MemoryStore } from "./memory-store";
import { SupabaseMemoryStore } from "./supabase-memory-store";

/** Composition root for memory storage: the only file that picks the implementation. */
export function getMemoryStore(): MemoryStore {
  return new SupabaseMemoryStore(getSupabaseServerClient());
}
