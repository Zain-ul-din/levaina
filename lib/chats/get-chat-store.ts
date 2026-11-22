import "server-only";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import type { ChatStore } from "./chat-store";
import { SupabaseChatStore } from "./supabase-chat-store";

/** Composition root for chat storage: the only file that picks the implementation. */
export function getChatStore(): ChatStore {
  return new SupabaseChatStore(getSupabaseServerClient());
}
