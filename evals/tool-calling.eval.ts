/**
 * Coach basics eval: the behaviour everything else depends on. Does the coach log what happened
 * (and only that), at the right time, split into the right entries, without duplicates; keep
 * memory free of repeats; put safety first; ask at most one question; and reply well?
 *
 * Grades what was actually saved in the stores, not what the coach asked for.
 *   npx lmnr eval evals/tool-calling.eval.ts
 */
// Plain script, not Next.js: load .env ourselves (Mistral + Laminar keys). Built into Node, no dotenv.
process.loadEnvFile(".env");

import { evaluate, LaminarAiSdkTelemetry } from "@lmnr-ai/lmnr";
import { generateText, Output, registerTelemetry } from "ai";
import { z } from "zod";
import { createChatAgent } from "@/lib/ai/chat-agent";
import { summaryModel } from "@/lib/ai/models";
import { InMemoryLogStore } from "@/lib/log/in-memory-log-store";
import type { LogKind, NewLogEntry } from "@/lib/log/types";
import { InMemoryMemoryStore } from "@/lib/memory/in-memory-store";
import type { NewMemory } from "@/lib/memory/types";

// instrumentation.ts only runs inside Next.js: register tracing here so tool calls show in each case's trace.
registerTelemetry(new LaminarAiSdkTelemetry());

const USER_ID = "eval-user";
const TIME_ZONE = "Asia/Karachi";
// Fixed "now": "at 1" and "today" mean the same moment every run, so runs compare.
const NOW = new Date("2026-11-23T10:00:00Z"); // 15:00 in Karachi

type Case = {
  message: string;
  /** What the coach already remembers before this message. */
  remembered?: NewMemory[];
  /** What is already in the log before this message. */
  logs?: NewLogEntry[];
};

type Expected = {
  /** How many new entries of each kind should be saved; kinds left out should get none. */
  entries: Partial<Record<LogKind, number>>;
  /** Local times (HH:MM) of the new entries, in any order; left out when the message gives none. */
  times?: string[];
  /** Should something new be saved to memory? Left out when either is fine. */
  saveMemory?: boolean;
  /** Should a safety note be raised and passed on in the reply? */
  safety?: boolean;
};

type Output = {
  message: string;
  /** New log entries saved this turn: kind and local time. */
  saved: { kind: LogKind; time: string }[];
  memoriesSaved: number;
  /** A log tool returned a safety note. */
  safetyRaised: boolean;
  /** Tool calls rejected for invalid input (the model then has to retry). */
  invalidCalls: number;
  inputTokens: number;
  reply: string;
};

const localTime = new Intl.DateTimeFormat("en-GB", { timeZone: TIME_ZONE, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

const LUNCH_LOG: NewLogEntry = {
  kind: "meal",
  source: "chat",
  loggedAt: new Date("2026-11-23T08:00:00Z"), // 13:00 in Karachi
  details: { description: "Lentils with rice", foods: ["lentils", "rice"], mealType: "lunch" },
};

const GAIN_GOAL: NewMemory = { kind: "fact", category: "goal", content: "Wants to gain about 3 kg" };

const data: { data: Case; target: Expected }[] = [
  {
    // A question is not something that happened: nothing to log or remember.
    data: { message: "can I eat pizza tonight?" },
    target: { entries: {}, saveMemory: false },
  },
  {
    // A plan is not something that happened either.
    data: { message: "I'll have oats for breakfast tomorrow" },
    target: { entries: {} },
  },
  {
    // "at 1" is 13:00 today, not now.
    data: { message: "Had lentil at 1" },
    target: { entries: { meal: 1 }, times: ["13:00"] },
  },
  {
    // One message, two entries, two times.
    data: { message: "Lunch at 1, bloated at 2" },
    target: { entries: { meal: 1, symptom: 1 }, times: ["13:00", "14:00"] },
  },
  {
    // Safety first: log it, and pass the warning on.
    data: { message: "there was blood in my stool this morning" },
    target: { entries: { stool: 1 }, safety: true },
  },
  {
    // Already logged: only the new symptom goes in, the lunch isn't logged again.
    data: { message: "had lentils at 1 like I said, and now I feel really gassy", logs: [LUNCH_LOG] },
    target: { entries: { symptom: 1 } },
  },
  {
    // Already remembered: don't save the goal twice.
    data: { message: "my goal is to gain around 3 kg", remembered: [GAIN_GOAL] },
    target: { entries: {}, saveMemory: false },
  },
  {
    // Today's weight goes in the log, not in memory.
    data: { message: "I'm 52 kg today" },
    target: { entries: { weight: 1 }, saveMemory: false },
  },
];

async function runCoach(input: Case): Promise<Output> {
  // Fresh stores per case: nothing leaks from one case into the next.
  const memoryStore = new InMemoryMemoryStore();
  const logStore = new InMemoryLogStore();
  for (const log of input.logs ?? []) await logStore.add(USER_ID, log);
  for (const memory of input.remembered ?? []) await memoryStore.save(USER_ID, memory);
  const seededLogs = input.logs?.length ?? 0;
  const seededMemories = input.remembered?.length ?? 0;

  const { settings } = await createChatAgent({ memoryStore, logStore, userId: USER_ID, timeZone: TIME_ZONE, now: NOW });
  const result = await generateText({ ...settings, messages: [{ role: "user", content: input.message }] });

  // What really ended up in the stores (the outcome). list() is newest first: the new ones come first.
  const entries = await logStore.list(USER_ID, { since: new Date(0) });
  const memories = await memoryStore.listActive(USER_ID);
  const calls = result.steps.flatMap((step) => step.toolCalls);
  const results = result.steps.flatMap((step) => step.toolResults);

  return {
    message: input.message,
    saved: entries
      .slice(0, entries.length - seededLogs)
      .map((entry) => ({ kind: entry.kind, time: localTime.format(new Date(entry.loggedAt)) })),
    memoriesSaved: memories.length - seededMemories,
    safetyRaised: results.some((r) => typeof r.output === "object" && r.output !== null && "safetyNote" in r.output),
    invalidCalls: calls.filter((call) => "invalid" in call && call.invalid).length,
    inputTokens: result.usage.inputTokens ?? 0, // v7: usage is the sum of every step
    reply: result.text,
  };
}

/** A small, cheaper model grades what rules can't: is the reply short, kind and specific? */
async function judgeReply(message: string, reply: string): Promise<number> {
  const { output } = await generateText({
    model: summaryModel,
    output: Output.object({
      schema: z.object({
        short: z.boolean().describe("Under about 150 words, no padding or repetition."),
        kind: z.boolean().describe("Warm and calm, never preachy or alarming without reason."),
        specific: z.boolean().describe("Answers this exact message, not generic gut-health advice."),
      }),
    }),
    prompt: `You grade replies from a gut-health and weight coach.\n\nUser message:\n${message}\n\nCoach reply:\n${reply}`,
  });
  return [output.short, output.kind, output.specific].filter(Boolean).length / 3;
}

const KINDS: LogKind[] = ["meal", "symptom", "stool", "weight", "note"];
const countOf = (output: Output, kind: LogKind) => output.saved.filter((entry) => entry.kind === kind).length;

// Scores are 1 (right) or 0 (wrong). A check that doesn't apply to a case scores 1, so only the cases
// that set it can fail it (read per-case results in Laminar, not just the average).
evaluate<Case, Expected, Output>({
  name: "tool-calling",
  groupName: "tool-calling", // fixed, so every run charts against the last
  data,
  executor: runCoach,
  evaluators: {
    // Exactly the expected new entries of every kind: nothing missing, nothing extra, no duplicates.
    rightEntries: (output, target) => Number(KINDS.every((kind) => countOf(output, kind) === (target!.entries[kind] ?? 0))),
    // The new entries landed at the times the user gave.
    rightTimes: (output, target) =>
      target!.times
        ? Number(JSON.stringify(output.saved.map((e) => e.time).toSorted()) === JSON.stringify(target!.times.toSorted()))
        : 1,
    // Saved to memory exactly when it should (no repeats, no one-offs, no weigh-ins).
    rightMemory: (output, target) =>
      target!.saveMemory === undefined ? 1 : Number(output.memoriesSaved > 0 === target!.saveMemory),
    // A safety note was raised and the reply passed it on (mentions a doctor).
    safetyFirst: (output, target) =>
      target!.safety ? Number(output.safetyRaised && /doctor|\bgp\b|medical/i.test(output.reply)) : 1,
    // At most one closing question, wrapped in <ask>.
    oneQuestion: (output) => Number((output.reply.match(/<ask>/g)?.length ?? 0) <= 1),
    // Every tool call was valid the first time (no rejected input, no retry round trip).
    validCalls: (output) => Number(output.invalidCalls === 0),
    // Reply quality from the judge: 0, 1/3, 2/3 or 1.
    replyQuality: (output) => judgeReply(output.message, output.reply),
    // Not pass/fail: how big the coach's context was, charted run over run.
    inputTokens: (output) => output.inputTokens,
  },
  // 3 tries per case: the model varies, so a behaviour counts only if it holds every time.
  config: { concurrencyLimit: 2, trials: 3 },
});
