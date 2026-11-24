/**
 * One coach turn against in-memory stores (no database, no Next.js), and a record of what really
 * happened: the entries saved and removed, memories saved, safety notes, rejected tool calls,
 * tokens and the reply. Shared by the evals so each one grades outcomes, not how it ran the coach.
 */
import { generateText } from "ai";
import { createChatAgent } from "@/lib/ai/chat-agent";
import { InMemoryLogStore } from "@/lib/log/in-memory-log-store";
import type { LogKind, NewLogEntry } from "@/lib/log/types";
import { InMemoryMemoryStore } from "@/lib/memory/in-memory-store";
import type { NewMemory } from "@/lib/memory/types";

export const EVAL_USER_ID = "eval-user";
export const EVAL_TIME_ZONE = "Asia/Karachi";
/** Fixed "now" (Monday 23 Nov 2026, 15:00 in Karachi), so "at 1", "yesterday" and weekdays mean the same every run. */
export const EVAL_NOW = new Date("2026-11-23T10:00:00Z");

export type CoachTurnInput = {
  message: string;
  /** What the coach already remembers before this message. */
  remembered?: NewMemory[];
  /** What is already in the log before this message. */
  logs?: NewLogEntry[];
};

export type CoachTurn = {
  message: string;
  /** Entries added this turn, with their local date (YYYY-MM-DD) and time (HH:MM). */
  added: { kind: LogKind; date: string; time: string }[];
  /** Entries that were already in the log and got removed (a correction). */
  removed: number;
  memoriesSaved: number;
  /** A log tool returned a safety note (red or black stool). */
  safetyNote: boolean;
  /** Tool calls rejected for invalid input (the model then has to retry). */
  invalidCalls: number;
  /** Research searches made this turn: the query sent out, and how many results came back. */
  searches: { query: string; results: number }[];
  inputTokens: number;
  reply: string;
};

const localParts = new Intl.DateTimeFormat("en-CA", {
  timeZone: EVAL_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
function localDateTime(iso: string) {
  const parts = Object.fromEntries(localParts.formatToParts(new Date(iso)).map((p) => [p.type, p.value]));
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

export async function runCoachTurn(input: CoachTurnInput): Promise<CoachTurn> {
  // Fresh stores per turn: nothing leaks from one case into the next.
  const memoryStore = new InMemoryMemoryStore();
  const logStore = new InMemoryLogStore();
  const seededIds = new Set<number>();
  for (const log of input.logs ?? []) seededIds.add((await logStore.add(EVAL_USER_ID, log)).id);
  for (const memory of input.remembered ?? []) await memoryStore.save(EVAL_USER_ID, memory);

  const { settings } = await createChatAgent({
    memoryStore,
    logStore,
    userId: EVAL_USER_ID,
    timeZone: EVAL_TIME_ZONE,
    now: EVAL_NOW,
  });
  const result = await generateText({ ...settings, messages: [{ role: "user", content: input.message }] });

  // The outcome: what is in the stores now, compared with what was seeded.
  const entries = await logStore.list(EVAL_USER_ID, { since: new Date(0) });
  const memories = await memoryStore.listActive(EVAL_USER_ID);
  const calls = result.steps.flatMap((step) => step.toolCalls);
  const results = result.steps.flatMap((step) => step.toolResults);

  return {
    message: input.message,
    added: entries
      .filter((entry) => !seededIds.has(entry.id))
      .map((entry) => ({ kind: entry.kind, ...localDateTime(entry.loggedAt) })),
    removed: [...seededIds].filter((id) => !entries.some((entry) => entry.id === id)).length,
    memoriesSaved: memories.length - (input.remembered?.length ?? 0),
    safetyNote: results.some((r) => typeof r.output === "object" && r.output !== null && "safetyNote" in r.output),
    invalidCalls: calls.filter((call) => "invalid" in call && call.invalid).length,
    searches: results
      .filter((r) => r.toolName === "searchResearch")
      .map((r) => ({
        query: String((r.input as { query?: string }).query ?? ""),
        results: typeof r.output === "object" && r.output !== null && "results" in r.output ? (r.output.results as unknown[]).length : 0,
      })),
    inputTokens: result.usage.inputTokens ?? 0, // v7: usage is the sum of every step
    reply: result.text,
  };
}
