import "server-only";
import { getSupabaseSessionClient } from "@/lib/supabase/session-client";
import type { LogStore } from "./log-store";
import { SupabaseLogStore } from "./supabase-log-store";

/** Composition root for log storage: the only file that picks the implementation. */
export async function getLogStore(): Promise<LogStore> {
  return new SupabaseLogStore(await getSupabaseSessionClient());
}
