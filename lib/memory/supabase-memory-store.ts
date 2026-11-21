import "server-only";
import type { Database } from "@/lib/supabase/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { MemoryNotFoundError, type MemoryStore } from "./memory-store";
import type { Memory, MemoryCategory, MemoryKind, MemoryStatus, NewMemory } from "./types";

type MemoryRow = Database["public"]["Tables"]["memories"]["Row"];

const COLUMNS = "id, kind, category, content, occurred_on, status, created_at";

/** Postgres-backed MemoryStore. The secret-key client bypasses RLS, so every query filters by user_id. */
export class SupabaseMemoryStore implements MemoryStore {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async listActive(userId: string, { episodeLimit = 20 } = {}) {
    const active = () =>
      this.db
        .from("memories")
        .select(COLUMNS)
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false });

    const [facts, episodes] = await Promise.all([
      active().eq("kind", "fact"),
      active().eq("kind", "episode").limit(episodeLimit),
    ]);
    return [...(unwrap(facts) ?? []), ...(unwrap(episodes) ?? [])].map(toMemory);
  }

  async save(userId: string, memory: NewMemory) {
    const result = await this.db
      .from("memories")
      .insert({
        user_id: userId,
        kind: memory.kind,
        category: memory.category,
        content: memory.content,
        occurred_on: memory.occurredOn ?? null,
      })
      .select(COLUMNS)
      .single();
    const row = unwrap(result);
    if (!row) throw new Error("Memory store: insert returned no row");
    return toMemory(row);
  }

  /**
   * Insert the replacement, then retire the old row pointing at it.
   * Not one transaction: if the old row was changed in between, the replacement is rolled back.
   */
  async supersede(userId: string, id: number, content: string) {
    const old = unwrap(
      await this.db
        .from("memories")
        .select(COLUMNS)
        .eq("user_id", userId)
        .eq("id", id)
        .eq("status", "active")
        .maybeSingle(),
    );
    if (!old) throw new MemoryNotFoundError(id);

    const replacement = await this.save(userId, {
      kind: old.kind as MemoryKind,
      category: old.category as MemoryCategory,
      content,
      occurredOn: old.occurred_on ?? undefined,
    });

    const retired = unwrap(
      await this.db
        .from("memories")
        .update({ status: "superseded", superseded_by: replacement.id })
        .eq("user_id", userId)
        .eq("id", id)
        .eq("status", "active")
        .select("id"),
    );
    if (!retired?.length) {
      await this.db.from("memories").delete().eq("id", replacement.id);
      throw new MemoryNotFoundError(id);
    }
    return replacement;
  }

  async forget(userId: string, id: number) {
    const row = unwrap(
      await this.db
        .from("memories")
        .update({ status: "forgotten" })
        .eq("user_id", userId)
        .eq("id", id)
        .eq("status", "active")
        .select(COLUMNS)
        .maybeSingle(),
    );
    return row ? toMemory(row) : null;
  }
}

type Picked = Pick<MemoryRow, "id" | "kind" | "category" | "content" | "occurred_on" | "status" | "created_at">;

// The CHECK constraints guarantee these columns only hold values from lib/memory/types.ts.
function toMemory(row: Picked): Memory {
  return {
    id: row.id,
    kind: row.kind as MemoryKind,
    category: row.category as MemoryCategory,
    content: row.content,
    occurredOn: row.occurred_on,
    status: row.status as MemoryStatus,
    createdAt: row.created_at,
  };
}

function unwrap<T>({ data, error }: { data: T; error: { message: string } | null }): T {
  if (error) throw new Error(`Memory store: ${error.message}`);
  return data;
}
