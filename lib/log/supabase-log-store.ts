import "server-only";
import type { Database } from "@/lib/supabase/database.types";
import { unwrap as unwrapResult } from "@/lib/supabase/unwrap";
import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_LOG_LIMIT, type LogRange, type LogStore } from "./log-store";
import type { LogEntry, NewLogEntry } from "./types";

type LogRow = Database["public"]["Tables"]["log_entries"]["Row"];

const COLUMNS = "id, kind, logged_at, details, source, created_at";

/** Postgres-backed LogStore. Runs as the signed-in user, so RLS applies; queries also filter by user_id. */
export class SupabaseLogStore implements LogStore {
  constructor(private readonly db: SupabaseClient<Database>) {}

  async add(userId: string, entry: NewLogEntry) {
    const row = unwrap(
      await this.db
        .from("log_entries")
        .insert({
          user_id: userId,
          kind: entry.kind,
          logged_at: entry.loggedAt.toISOString(),
          details: entry.details,
          source: entry.source,
        })
        .select(COLUMNS)
        .single(),
    );
    if (!row) throw new Error("Log store: insert returned no row");
    return toLogEntry(row);
  }

  async list(userId: string, { since, until, kinds, limit = DEFAULT_LOG_LIMIT }: LogRange) {
    let query = this.db
      .from("log_entries")
      .select(COLUMNS)
      .eq("user_id", userId)
      .gte("logged_at", since.toISOString());
    if (until) query = query.lt("logged_at", until.toISOString());
    if (kinds) query = query.in("kind", [...kinds]);
    const rows = unwrap(await query.order("logged_at", { ascending: false }).order("id", { ascending: false }).limit(limit));
    return (rows ?? []).map(toLogEntry);
  }

  async remove(userId: string, id: number) {
    const row = unwrap(
      await this.db.from("log_entries").delete().eq("user_id", userId).eq("id", id).select(COLUMNS).maybeSingle(),
    );
    return row ? toLogEntry(row) : null;
  }
}

type Picked = Pick<LogRow, "id" | "kind" | "logged_at" | "details" | "source" | "created_at">;

// Rows only get in through add(), whose input was validated against the kind's schema,
// and the CHECK constraints pin kind and source; so the casts restate what's already true.
function toLogEntry(row: Picked): LogEntry {
  return {
    id: row.id,
    kind: row.kind,
    details: row.details,
    loggedAt: new Date(row.logged_at).toISOString(),
    source: row.source,
    createdAt: new Date(row.created_at).toISOString(),
  } as LogEntry;
}

const unwrap = <T,>(result: { data: T; error: { message: string } | null }) => unwrapResult(result, "Log store");
