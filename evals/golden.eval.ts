/**
 * The golden eval: every golden case (evals/golden/cases.ts), tagged with its tier, graded by rule
 * checks on what really happened. Reply quality is scored by people against each case's `golden`
 * line, with the pass/fail rubric (helpful, specific, safe, tone, concise, send).
 *
 * In Laminar, filter or group by metadata.tier to see where the coach struggles.
 *   npx lmnr eval evals/golden.eval.ts
 */
// Plain script, not Next.js: load .env ourselves (Mistral + Laminar keys). Built into Node, no dotenv.
process.loadEnvFile(".env");

import { evaluate, LaminarAiSdkTelemetry } from "@lmnr-ai/lmnr";
import { registerTelemetry } from "ai";
import type { LogKind } from "@/lib/log/types";
import { GOLDEN_CASES, type Expected } from "./golden/cases";
import { runCoachTurn, type CoachTurn, type CoachTurnInput } from "./lib/run-coach";

// instrumentation.ts only runs inside Next.js: register tracing here so each case has its trace.
registerTelemetry(new LaminarAiSdkTelemetry());

const KINDS: LogKind[] = ["meal", "symptom", "stool", "weight", "note"];
const sameSet = (a: string[], b: string[]) => JSON.stringify(a.toSorted()) === JSON.stringify(b.toSorted());
/** Count matches when it equals the expected count, or is one of the accepted counts. */
const countOk = (count: number, expected: number | number[] = 0) =>
  Array.isArray(expected) ? expected.includes(count) : count === expected;

/** Each rule: 1 pass, 0 fail, null when the case doesn't set it (left out of the average). */
const RULES: Record<string, (out: CoachTurn, exp: Expected) => number | null> = {
  rightEntries: (out, exp) =>
    exp.entries ? Number(KINDS.every((k) => countOk(out.added.filter((e) => e.kind === k).length, exp.entries![k]))) : null,
  rightDates: (out, exp) => (exp.dates ? Number(sameSet(out.added.map((e) => e.date), exp.dates)) : null),
  rightTimes: (out, exp) => (exp.times ? Number(sameSet(out.added.map((e) => e.time), exp.times)) : null),
  rightCorrection: (out, exp) => (exp.removed === undefined ? null : Number(out.removed === exp.removed)),
  rightMemory: (out, exp) => (exp.saveMemory === undefined ? null : Number(out.memoriesSaved > 0 === exp.saveMemory)),
  safetyNote: (out, exp) => (exp.safetyNote === undefined ? null : Number(out.safetyNote === exp.safetyNote)),
  doctorFirst: (out, exp) => (exp.doctor ? Number(/doctor|\bgp\b|urgent|emergency|medical/i.test(out.reply)) : null),
  asksWhenUnsure: (out, exp) => (exp.asks ? Number(out.reply.includes("<ask>")) : null),
};

evaluate<CoachTurnInput, Expected, CoachTurn>({
  name: "golden",
  groupName: "golden", // fixed, so every run charts against the last
  data: GOLDEN_CASES.map((c) => ({
    data: c.input,
    target: c.expected,
    metadata: { id: c.id, tier: c.tier, golden: c.golden },
  })),
  executor: runCoachTurn,
  evaluators: {
    // All of this case's rules at once: 1 only if every rule it sets passes. The headline number.
    pass: (out, exp) => {
      const scores = Object.values(RULES).map((rule) => rule(out, exp!));
      return Number(scores.every((s) => s === null || s === 1));
    },
    // Each rule on its own, as named scores (only the ones this case sets), to see what failed.
    rules: (out, exp) =>
      Object.fromEntries(
        Object.entries(RULES).flatMap(([name, rule]) => {
          const score = rule(out, exp!);
          return score === null ? [] : [[name, score]];
        }),
      ),
    // Every tool call was valid the first time (no rejected input, no retry round trip).
    validCalls: (out) => Number(out.invalidCalls === 0),
    // Not pass/fail: how big the coach's context was, charted run over run.
    inputTokens: (out) => out.inputTokens,
  },
  config: { concurrencyLimit: 3, trials: 1 },
});
