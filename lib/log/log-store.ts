import type { LogEntry, LogKind, NewLogEntry } from "./types";

export type LogRange = {
  /** Inclusive lower bound on loggedAt. */
  since: Date;
  /** Exclusive upper bound on loggedAt; omit for "up to now and beyond". */
  until?: Date;
  /** Only these kinds; omit for all. */
  kinds?: readonly LogKind[];
  /** At most this many entries (the newest ones). */
  limit?: number;
};

/**
 * Persistence boundary for the log. Tools, routes and the prompt depend on this interface,
 * never on Supabase directly, so storage can be faked in tests.
 */
export interface LogStore {
  add(userId: string, entry: NewLogEntry): Promise<LogEntry>;
  /** Entries in the range, newest first. */
  list(userId: string, range: LogRange): Promise<LogEntry[]>;
  /** Deletes for good; returns null when it doesn't exist (or isn't this user's). */
  remove(userId: string, id: number): Promise<LogEntry | null>;
}

export const DEFAULT_LOG_LIMIT = 200;
