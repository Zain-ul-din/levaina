import { model } from "@/lib/ai/models";
import { buildSystemInstructions } from "@/lib/ai/system-instructions";
import { createLogTools } from "@/lib/ai/tools/log-tools";
import { createMemoryTools } from "@/lib/ai/tools/memory-tools";
import { createResearchTools } from "@/lib/ai/tools/research-tools";
import { getResearchSearch, type ResearchSearch } from "@/lib/research/exa-search";
import { traced, type TraceContext } from "@/lib/ai/telemetry";
import { loadLogContext, type LogContext } from "@/lib/log/log-context";
import type { LogStore } from "@/lib/log/log-store";
import type { MemoryStore } from "@/lib/memory/memory-store";
import type { Memory } from "@/lib/memory/types";
import { isStepCount } from "ai";

/** Tool call → tool result → more text counts as steps; this caps runaway tool loops. */
const MAX_STEPS = 6;

type ChatAgentOptions = {
  memoryStore: MemoryStore;
  logStore: LogStore;
  /** Research search: the Exa search by default (when EXA_API_KEY is set), null to switch it off. */
  researchSearch?: ResearchSearch | null;
  userId: string;
  timeZone: string;
  now?: Date;
  /** Pass if already loaded (the route needs them earlier, for compaction). */
  memories?: Memory[];
  /** Pass if already loaded; otherwise the last week is read from the log store. */
  log?: LogContext;
  /** Running summary of older, compacted messages in this chat. */
  conversationSummary?: string | null;
  /** The user and chat, for tracing. Optional: offline evals have no chat. */
  trace?: TraceContext;
};

/**
 * Everything that defines the coach for one turn (model, prompt, tools, step policy), in one place.
 * The API route and offline evals both use this, so what we test is what we ship.
 */
export async function createChatAgent({
  memoryStore,
  logStore,
  userId,
  timeZone,
  now = new Date(),
  conversationSummary = null,
  trace,
  researchSearch = getResearchSearch(),
  ...options
}: ChatAgentOptions) {
  const [memories, log] = await Promise.all([
    options.memories ?? memoryStore.listActive(userId),
    options.log ?? loadLogContext(logStore, userId, now),
  ]);
  const tools = {
    ...createMemoryTools({ store: memoryStore, userId }),
    ...createLogTools({ store: logStore, userId, timeZone, now }),
    ...(researchSearch ? createResearchTools({ search: researchSearch }) : {}),
  };

  return {
    memories,
    log,
    tools,
    settings: {
      model,
      instructions: buildSystemInstructions({ now, timeZone, memories, log, conversationSummary, canSearchResearch: Boolean(researchSearch) }),
      tools,
      stopWhen: isStepCount(MAX_STEPS),
      // Large 4 always reasons; "low" caps it. On the coach eval (Nov 2026) low kept 24/24 and cut the
      // median reply from ~15s to ~6s and the worst case from 77s to 15s (default thinking ran to 150s in the app).
      providerOptions: { mistral: { reasoningEffort: "low" as const } },
      // Step 0 must decide about memory and the log: save/log something, or explicitly noNewMemory.
      // Prompting alone let the model skip saving in long conversations (~1 in 3 turns).
      prepareStep: ({ stepNumber }: { stepNumber: number }) =>
        stepNumber === 0 ? { toolChoice: "required" as const } : undefined,
      ...traced("coach-reply", trace),
    },
  };
}
