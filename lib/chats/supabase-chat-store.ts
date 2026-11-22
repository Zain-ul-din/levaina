import "server-only";
import type { ChatUIMessage } from "@/lib/chat/types";
import type { Database, Json } from "@/lib/supabase/database.types";
import { unwrap as unwrapResult } from "@/lib/supabase/unwrap";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { ChatStore, ChatSummary, ListChatsOptions, SaveMessagesInput } from "./chat-store";

const unwrap = <T,>(result: { data: T; error: { message: string } | null }) => unwrapResult(result, "Chat store");

/** Postgres-backed ChatStore. Runs as the signed-in user, so RLS applies; queries also filter by user_id. */
export class SupabaseChatStore implements ChatStore {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async load(userId: string, chatId: string) {
    const chat = unwrap(
      await this.db.from("chats").select("id").eq("user_id", userId).eq("id", chatId).maybeSingle(),
    );
    if (!chat) return null;

    const rows = unwrap(
      await this.db
        .from("chat_messages")
        .select("id, role, parts, metadata")
        .eq("user_id", userId)
        .eq("chat_id", chatId)
        .order("position"),
    );
    return (rows ?? []).map(
      (row) =>
        ({
          id: row.id,
          role: row.role,
          parts: row.parts,
          ...(row.metadata ? { metadata: row.metadata } : {}),
        }) as unknown as ChatUIMessage,
    );
  }

  async list(userId: string, { limit, before }: ListChatsOptions): Promise<ChatSummary[]> {
    let query = this.db.from("chats").select("id, title, updated_at").eq("user_id", userId);
    if (before) query = query.lt("updated_at", before);
    const rows = unwrap(await query.order("updated_at", { ascending: false }).limit(limit));
    return (rows ?? []).map((row) => ({
      id: row.id,
      title: row.title ?? "New chat",
      updatedAt: new Date(row.updated_at).toISOString(),
    }));
  }

  /** Messages go with it (ON DELETE CASCADE). */
  async remove(userId: string, chatId: string) {
    const rows = unwrap(await this.db.from("chats").delete().eq("user_id", userId).eq("id", chatId).select("id"));
    return (rows?.length ?? 0) > 0;
  }

  /**
   * Create-if-new, delete from `from`, insert the new rows, bump updated_at.
   * Not one transaction; a failure between steps leaves the earlier messages intact.
   */
  async saveMessages(userId: string, chatId: string, { from, messages, title }: SaveMessagesInput) {
    unwrap(
      await this.db
        .from("chats")
        .upsert({ user_id: userId, id: chatId, title: title ?? null }, { onConflict: "user_id,id", ignoreDuplicates: true }),
    );
    unwrap(
      await this.db.from("chat_messages").delete().eq("user_id", userId).eq("chat_id", chatId).gte("position", from),
    );
    if (messages.length > 0) {
      unwrap(
        await this.db.from("chat_messages").insert(
          messages.map((message, index) => ({
            user_id: userId,
            chat_id: chatId,
            position: from + index,
            id: message.id,
            role: message.role,
            parts: message.parts as unknown as NonNullable<Json>,
            metadata: (message.metadata ?? null) as Json,
          })),
        ),
      );
    }
    // Touch the chat so it sorts first in the chat list.
    unwrap(
      await this.db
        .from("chats")
        .update({ updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq("id", chatId),
    );
  }
}
