import "server-only";
import { getSupabaseSessionClient } from "@/lib/supabase/session-client";
import type { ChatStore } from "./chat-store";
import { SupabaseChatStore } from "./supabase-chat-store";

/** Composition root for chat storage: the only file that picks the implementation. */
export async function getChatStore(): Promise<ChatStore> {
  return new SupabaseChatStore(await getSupabaseSessionClient());
}
