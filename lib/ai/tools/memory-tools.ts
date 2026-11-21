import { MemoryNotFoundError, type MemoryStore } from "@/lib/memory/memory-store";
import { memoryContentSchema, newMemorySchema } from "@/lib/memory/types";
import { tool } from "ai";
import { z } from "zod";

const memoryIdSchema = z.number().int().positive().describe("The [id] shown next to the memory");

type MemoryToolsOptions = {
  store: MemoryStore;
  userId: string;
};

/**
 * Memory tools bound to one user. Created per request, so the user id comes from
 * the server (never from the model) and the model can't touch anyone else's data.
 */
export function createMemoryTools({ store, userId }: MemoryToolsOptions) {
  return {
    saveMemory: tool({
      description:
        "Save something durable and health-relevant about the user to long-term memory. " +
        "Check the existing memories first; use updateMemory instead of saving a duplicate.",
      inputSchema: newMemorySchema.refine(
        (memory) => (memory.kind === "episode") === Boolean(memory.occurredOn),
        { message: "Episodes need occurredOn; facts must not have it.", path: ["occurredOn"] },
      ),
      execute: async (memory) => {
        const saved = await store.save(userId, memory);
        return { id: saved.id, content: saved.content };
      },
    }),

    updateMemory: tool({
      description:
        "Replace an existing memory whose information has changed (e.g. a new goal weight). " +
        "The old version is kept as history.",
      inputSchema: z.object({ id: memoryIdSchema, content: memoryContentSchema }),
      execute: async ({ id, content }) => {
        try {
          const updated = await store.supersede(userId, id, content);
          return { id: updated.id, content: updated.content };
        } catch (error) {
          if (error instanceof MemoryNotFoundError) return { error: error.message };
          throw error;
        }
      },
    }),

    forgetMemory: tool({
      description: "Remove a memory the user says is wrong or asks you to forget.",
      inputSchema: z.object({ id: memoryIdSchema }),
      execute: async ({ id }) => {
        const forgotten = await store.forget(userId, id);
        return forgotten
          ? { id: forgotten.id, content: forgotten.content }
          : { error: `Memory ${id} doesn't exist or is no longer active.` };
      },
    }),
  };
}

export type MemoryTools = ReturnType<typeof createMemoryTools>;
