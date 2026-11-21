import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/server/env";
import type { Database } from "./database.types";

let client: SupabaseClient<Database> | undefined;

/**
 * Server-side client using the secret key, which bypasses RLS.
 * Every query must therefore filter by user_id itself. Never import this into client code.
 */
export function getSupabaseServerClient() {
  const { SUPABASE_URL, SUPABASE_SECRET_KEY } = getServerEnv();
  client ??= createClient<Database>(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
