/**
 * Coach memory eval: when a message holds something lasting (a homemade protein powder they use),
 * does the coach save it to memory as well as logging the meal, without saving one-offs or
 * things it already remembers?
 *
 * Runs the real coach (createChatAgent) against in-memory stores: no database, no Next.js.
 *   npx lmnr eval evals/coach-memory.eval.ts
 */
// Plain script, not Next.js: load .env ourselves (Mistral + Laminar keys). Built into Node, no dotenv.
process.loadEnvFile(".env");

import { evaluate, LaminarAiSdkTelemetry } from "@lmnr-ai/lmnr";
import { generateText, registerTelemetry } from "ai";
import { createChatAgent } from "@/lib/ai/chat-agent";
import { InMemoryLogStore } from "@/lib/log/in-memory-log-store";
import { InMemoryMemoryStore } from "@/lib/memory/in-memory-store";
import type { NewMemory } from "@/lib/memory/types";

// instrumentation.ts only runs inside Next.js: register tracing here so tool calls show in each case's trace.
registerTelemetry(new LaminarAiSdkTelemetry());

const USER_ID = "eval-user";
const TIME_ZONE = "Asia/Karachi";
// Fixed "now": "just ate" means the same moment every run, so runs compare.
const NOW = new Date("2026-11-23T08:00:00Z"); // 13:00 in Karachi

type Case = {
  message: string;
  /** What the coach already remembers before this message. */
  remembered?: NewMemory[];
};
type Expected = {
  /** Should it log a meal? */
  logMeal: boolean;
  /** Should it save something new to memory? */
  saveMemory: boolean;
};
type Output = {
  tools: string[];
  saved: string[];
  inputTokens: number;
  reply: string;
};

const PROTEIN_POWDER: NewMemory = {
  kind: "fact",
  category: "preference",
  content:
    "Takes a homemade protein powder of roasted chickpeas, almonds and cashews",
};

const data: { data: Case; target: Expected }[] = [
  {
    // The bug: a meal that also reveals something lasting.
    data: {
      message:
        "I just ate boiled white rice, cabbage salad, 1.5 tea spoon organic protien powder that we made it at home, it is combination of roasted chickpea, almonds, cashwes, all blended together.",
    },
    target: { logMeal: true, saveMemory: true },
  },
  {
    // Same idea, said as a habit without a meal to log.
    data: {
      message:
        "every morning i take 2 spoons of our homemade protein powder (chickpeas + almonds) in milk",
    },
    target: { logMeal: false, saveMemory: true },
  },
  {
    // Control: a one-off meal, nothing lasting.
    data: { message: "had 2 parathas and an omelette for breakfast" },
    target: { logMeal: true, saveMemory: false },
  },
  {
    // Already remembered: log the meal, don't save the powder again.
    data: {
      message: "lunch was rice and lentils with a spoon of my protein powder",
      remembered: [PROTEIN_POWDER],
    },
    target: { logMeal: true, saveMemory: false },
  },
];

async function runCoach(input: Case): Promise<Output> {
  // Fresh stores per case: nothing leaks from one case into the next.
  const memoryStore = new InMemoryMemoryStore();
  const logStore = new InMemoryLogStore();
  for (const memory of input.remembered ?? [])
    await memoryStore.save(USER_ID, memory);

  const { settings } = await createChatAgent({
    memoryStore,
    logStore,
    userId: USER_ID,
    timeZone: TIME_ZONE,
    now: NOW,
  });
  const result = await generateText({
    ...settings,
    messages: [{ role: "user", content: input.message }],
  });

  const calls = result.steps.flatMap((step) => step.toolCalls);
  return {
    tools: calls.map((call) => call.toolName),
    saved: calls
      .filter((call) => call.toolName === "saveMemory")
      .map((call) => (call.input as NewMemory).content),
    inputTokens: result.usage.inputTokens ?? 0, // v7: usage is the sum of every step
    reply: result.text,
  };
}

const count = (output: Output, tool: string) =>
  output.tools.filter((name) => name === tool).length;

evaluate<Case, Expected, Output>({
  name: "coach-memory",
  groupName: "coach-memory", // fixed, so every run charts against the last
  data,
  executor: runCoach,
  evaluators: {
    // 1 when it logged a meal exactly when it should.
    logged: (output, target) =>
      Number(count(output, "logMeal") > 0 === target!.logMeal),
    // 1 when it saved to memory exactly when it should (also catches saving twice / saving one-offs).
    remembered: (output, target) =>
      Number(count(output, "saveMemory") > 0 === target!.saveMemory),
    // 1 unless the same meal was logged more than once.
    noDuplicateLog: (output) => Number(count(output, "logMeal") <= 1),
    // Not pass/fail: how big the coach's context was, charted run over run.
    inputTokens: (output) => output.inputTokens,
  },
  // 3 tries per case: the model varies, so a fix counts only if it holds every time.
  config: { concurrencyLimit: 2, trials: 3 },
});
