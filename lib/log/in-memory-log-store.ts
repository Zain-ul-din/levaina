import { DEFAULT_LOG_LIMIT, type LogRange, type LogStore } from "./log-store";
import type { LogEntry, NewLogEntry } from "./types";

type StoredEntry = { userId: string; entry: LogEntry };

/** Fake store for evals and tests: same behaviour as the real one, kept in an array. */
export class InMemoryLogStore implements LogStore {
  private rows: StoredEntry[] = [];
  private nextId = 1;

  async add(userId: string, { loggedAt, ...entry }: NewLogEntry) {
    const stored = {
      ...entry,
      id: this.nextId++,
      loggedAt: loggedAt.toISOString(),
      createdAt: new Date().toISOString(),
    } as LogEntry;
    this.rows.push({ userId, entry: stored });
    return stored;
  }

  async list(userId: string, { since, until, limit = DEFAULT_LOG_LIMIT }: LogRange) {
    return this.rows
      .filter(({ userId: owner, entry }) => {
        const at = Date.parse(entry.loggedAt);
        return owner === userId && at >= since.getTime() && (!until || at < until.getTime());
      })
      .map(({ entry }) => entry)
      .sort((a, b) => Date.parse(b.loggedAt) - Date.parse(a.loggedAt) || b.id - a.id)
      .slice(0, limit);
  }

  async remove(userId: string, id: number) {
    const index = this.rows.findIndex((row) => row.userId === userId && row.entry.id === id);
    if (index === -1) return null;
    return this.rows.splice(index, 1)[0].entry;
  }

  /** Test helper: every entry for every user. */
  all() {
    return this.rows.map(({ entry }) => entry);
  }
}
