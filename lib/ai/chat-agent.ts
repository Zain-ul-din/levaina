import { model } from "@/lib/ai/models";
import { buildSystemInstructions } from "@/lib/ai/system-instructions";
import { createMemoryTools } from "@/lib/ai/tools/memory-tools";
import type { MemoryStore } from "@/lib/memory/memory-store";
import { isStepCount } from "ai";

/** Tool call → tool result → more text counts as steps; this caps runaway tool loops. */
const MAX_STEPS = 5;

type ChatAgentOptions = {
  store: MemoryStore;
  userId: string;
  timeZone: string;
  now?: Date;
};

/**
 * Everything that defines the coach for one turn (model, prompt, tools, step policy), in one place.
 * The API route and offline evals both use this, so what we test is what we ship.
 */
export async function createChatAgent({ store, userId, timeZone, now = new Date() }: ChatAgentOptions) {
  const memories = await store.listActive(userId);
  const tools = createMemoryTools({ store, userId });

  return {
    memories,
    tools,
    settings: {
      model,
      instructions: buildSystemInstructions({ now, timeZone, memories }),
      tools,
      stopWhen: isStepCount(MAX_STEPS),
      // Step 0 must decide about memory: save/update/forget, or explicitly noNewMemory.
      // Prompting alone let the model skip saving in long conversations (~1 in 3 turns).
      prepareStep: ({ stepNumber }: { stepNumber: number }) =>
        stepNumber === 0 ? { toolChoice: "required" as const } : undefined,
    },
  };
}
