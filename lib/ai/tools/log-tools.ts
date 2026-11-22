import { describeEntry } from "@/lib/log/describe-entry";
import type { LogStore } from "@/lib/log/log-store";
import { checkLogTime, localDateTimeToDate } from "@/lib/log/log-time";
import { safetyNoteFor } from "@/lib/log/safety";
import { LOG_DETAILS_SCHEMAS, type LogDetails, type LogKind, type NewLogEntry } from "@/lib/log/types";
import { tool } from "ai";
import { z } from "zod";

type LogToolsOptions = {
  store: LogStore;
  userId: string;
  /** The user's IANA zone: the model gives wall-clock times, the server turns them into moments. */
  timeZone: string;
  now: Date;
};

/** What every log tool returns; the chat chip renders it, the model reads it. */
export type LogToolOutput =
  | {
      id: number;
      kind: LogKind;
      loggedAt: string;
      text: string;
      safetyNote?: string;
      /** This call repeated an earlier one in the same reply; nothing new was saved (the chip hides it). */
      duplicate?: true;
    }
  | { error: string };

/** Same kind, same moment, same details (key order ignored) = the same entry. */
const entryKey = (entry: NewLogEntry) =>
  JSON.stringify([entry.kind, entry.loggedAt.toISOString(), Object.entries(entry.details).sort(([a], [b]) => a.localeCompare(b))]);

// Required but nullable, like the stool fields: models drop optional fields (a meal "at 1" was
// saved as "now"), while null has to be chosen on purpose.
const atSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/)
  .nullable()
  .describe(
    "When it happened, in the user's local time as YYYY-MM-DDTHH:mm (e.g. '2026-11-22T13:00'). " +
      "Use the time they gave ('at 1' = 13:00 today); for a vague one ('this morning') pick a sensible time. " +
      "null only if it's happening right now or they gave no time at all.",
  );

const DESCRIPTIONS = {
  meal:
    "Log a meal, snack or drink the user had (not one they're planning or asking about). " +
    "Split it into simple foods so patterns can be found later.",
  symptom: "Log gut symptoms the user had at a particular time (not a long-standing pattern: that's memory).",
  stool:
    "Log a bowel movement with whatever they told you: its shape (Bristol type), its colour, or both. " +
    "Log it even if they only mention one. Log 'no stool today' as a note.",
  weight: "Log a weigh-in. The current weight belongs here, not in memory.",
  note:
    "Log something else from that time that can affect the gut or weight: poor sleep, stress, exercise, " +
    "period, travel, a missed meal, a new medication dose.",
} satisfies Record<LogKind, string>;

/**
 * Log tools bound to one user, created per request (the user id comes from the server, never the model).
 * One small tool per kind instead of one tool with a branching schema: each stays simple for the model,
 * and all of them are built from the same per-kind schemas in lib/log/types.ts.
 */
export function createLogTools({ store, userId, timeZone, now }: LogToolsOptions) {
  const save = async (entry: NewLogEntry): Promise<LogToolOutput> => {
    const saved = await store.add(userId, entry);
    const safetyNote = safetyNoteFor(saved);
    return { id: saved.id, kind: saved.kind, loggedAt: saved.loggedAt, text: describeEntry(saved), ...(safetyNote && { safetyNote }) };
  };

  // Some models send the same log call twice in one step, in parallel. Remember each save's *promise*
  // as soon as it starts (before awaiting), so the twin finds it and reuses the result instead of
  // saving a second row. Scoped to this request, so logging the same meal on another day still works.
  const savesThisReply = new Map<string, Promise<LogToolOutput>>();
  const add = (entry: NewLogEntry): Promise<LogToolOutput> => {
    const key = entryKey(entry);
    const earlier = savesThisReply.get(key);
    if (earlier) return earlier.then((output) => ("error" in output ? output : { ...output, duplicate: true as const }));
    const saving = save(entry);
    savesThisReply.set(key, saving);
    return saving;
  };

  const logTool = <K extends LogKind>(kind: K) => {
    // TypeScript can't see through a schema picked by a generic key, so state the input type it produces.
    const inputSchema = LOG_DETAILS_SCHEMAS[kind].extend({ at: atSchema }) as unknown as z.ZodType<
      LogDetails<K> & { at: string | null }
    >;
    return tool({
      description: DESCRIPTIONS[kind],
      inputSchema,
      execute: async ({ at, ...details }): Promise<LogToolOutput> => {
        const loggedAt = at ? localDateTimeToDate(at, timeZone) : now;
        if (!loggedAt) return { error: `"${at}" isn't a valid local date and time (YYYY-MM-DDTHH:mm).` };
        const problem = checkLogTime(loggedAt, now);
        if (problem) return { error: problem };
        // Safe: `details` was just validated by the schema for this same `kind`.
        return add({ kind, details, loggedAt, source: "chat" } as unknown as NewLogEntry);
      },
    });
  };

  return {
    logMeal: logTool("meal"),
    logSymptom: logTool("symptom"),
    logStool: logTool("stool"),
    logWeight: logTool("weight"),
    logNote: logTool("note"),

    removeLogEntry: tool({
      description:
        "Delete a log entry that's wrong (the user corrected it, or it was logged twice). " +
        "To change an entry, remove it and log the corrected one.",
      inputSchema: z.object({ id: z.number().int().positive().describe("The [id] shown next to the log entry") }),
      execute: async ({ id }): Promise<LogToolOutput> => {
        const removed = await store.remove(userId, id);
        return removed
          ? { id: removed.id, kind: removed.kind, loggedAt: removed.loggedAt, text: describeEntry(removed) }
          : { error: `Log entry ${id} doesn't exist.` };
      },
    }),
  };
}

export type LogTools = ReturnType<typeof createLogTools>;
