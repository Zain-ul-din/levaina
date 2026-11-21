import type { Memory, NewMemory } from "./types";

/**
 * Persistence boundary for memories. Tools and routes depend on this interface,
 * never on Supabase directly, so storage can be swapped or faked in tests.
 */
export interface MemoryStore {
  /** Active facts (all) plus the most recent active episodes, newest first. */
  listActive(userId: string, options?: { episodeLimit?: number }): Promise<Memory[]>;
  save(userId: string, memory: NewMemory): Promise<Memory>;
  /** Replaces an active memory with new content, keeping the old one as history. */
  supersede(userId: string, id: number, content: string): Promise<Memory>;
  /** Soft-deletes; returns null when the memory doesn't exist or isn't active. */
  forget(userId: string, id: number): Promise<Memory | null>;
}

export class MemoryNotFoundError extends Error {
  constructor(id: number) {
    super(`Memory ${id} doesn't exist or is no longer active.`);
    this.name = "MemoryNotFoundError";
  }
}
