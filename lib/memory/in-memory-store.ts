import { MemoryNotFoundError, type MemoryStore } from "./memory-store";
import type { Memory, NewMemory } from "./types";

type StoredMemory = Memory & { userId: string };

/** Fake store for evals and tests: same behaviour as the real one, kept in an array. */
export class InMemoryMemoryStore implements MemoryStore {
  private rows: StoredMemory[] = [];
  private nextId = 1;

  async listActive(userId: string, { episodeLimit = 20 } = {}) {
    const active = this.rows
      .filter((row) => row.userId === userId && row.status === "active")
      .toReversed();
    const facts = active.filter((row) => row.kind === "fact");
    const episodes = active.filter((row) => row.kind === "episode").slice(0, episodeLimit);
    return [...facts, ...episodes].map(strip);
  }

  async save(userId: string, memory: NewMemory) {
    const row: StoredMemory = {
      id: this.nextId++,
      userId,
      kind: memory.kind,
      category: memory.category,
      content: memory.content,
      occurredOn: memory.occurredOn ?? null,
      status: "active",
      createdAt: new Date().toISOString(),
    };
    this.rows.push(row);
    return strip(row);
  }

  async supersede(userId: string, id: number, content: string) {
    const old = this.findActive(userId, id);
    if (!old) throw new MemoryNotFoundError(id);
    const replacement = await this.save(userId, { ...old, content, occurredOn: old.occurredOn ?? undefined });
    old.status = "superseded";
    return replacement;
  }

  async forget(userId: string, id: number) {
    const row = this.findActive(userId, id);
    if (!row) return null;
    row.status = "forgotten";
    return strip(row);
  }

  /** Test helper: everything stored, including superseded and forgotten rows. */
  all() {
    return this.rows.map(strip);
  }

  private findActive(userId: string, id: number) {
    return this.rows.find((row) => row.userId === userId && row.id === id && row.status === "active");
  }
}

/** Drops the owner column, matching what the real store returns. */
const strip = (row: StoredMemory): Memory => ({
  id: row.id,
  kind: row.kind,
  category: row.category,
  content: row.content,
  occurredOn: row.occurredOn,
  status: row.status,
  createdAt: row.createdAt,
});
