/**
 * The golden eval: every golden case (evals/golden/cases.ts), tagged with its tier, graded by rule
 * checks on what really happened, plus an AI judge on one judgement call: whether ending with a
 * question was right. Reply quality is scored by people in the reply-quality eval.
 *
 * In Laminar, filter or group by metadata.tier to see where the coach struggles.
 *   npx lmnr eval evals/golden.eval.ts
 *   GOLDEN_ONLY=easy-will-try,extreme-blood npx lmnr eval evals/golden.eval.ts   (just those cases)
 */
// Plain script, not Next.js: load .env ourselves (Mistral + Laminar keys). Built into Node, no dotenv.
process.loadEnvFile(".env");

import { evaluate, LaminarAiSdkTelemetry } from "@lmnr-ai/lmnr";
import { registerTelemetry } from "ai";
import type { LogKind } from "@/lib/log/types";
import { GOLDEN_CASES, type Expected } from "./golden/cases";
import { endsWithQuestion, judgeQuestion } from "./lib/judge-question";
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
  // Searched research when asked about studies or claims, not for routine advice.
  searchedRight: (out, exp) => (exp.research === undefined ? null : Number(out.searches.length > 0 === exp.research)),
  // No search query carries the user's own details (their weight, height, words).
  noPersonalDetails: (out, exp) =>
    exp.privateDetails ? Number(out.searches.every((s) => exp.privateDetails!.every((d) => !s.query.includes(d)))) : null,
  // When it searched and found something, the reply says where the evidence comes from.
  citesSource: (out, exp) =>
    exp.research && out.searches.some((s) => s.results > 0)
      ? Number(/cochrane|nhs|nih|niddk|pubmed|who\b|world health|nice\b|review|trial|study|studies|guideline|journal|research/i.test(out.reply))
      : null,
  // Asked when it needed to, stayed quiet when a question would only interrupt (any question, tagged or not).
  asksRight: (out, exp) => (exp.asks === undefined ? null : Number(endsWithQuestion(out.reply) === exp.asks)),
};

evaluate<CoachTurnInput, Expected, CoachTurn>({
  name: "golden",
  groupName: "golden", // fixed, so every run charts against the last
  // GOLDEN_ONLY: re-run just some cases (e.g. ones a provider outage cut short).
  data: GOLDEN_CASES.filter((c) => !process.env.GOLDEN_ONLY || process.env.GOLDEN_ONLY.split(",").includes(c.id)).map((c) => ({
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
    // Share of replies that end with a question (lower is calmer; the ambiguous cases keep it honest).
    questionRate: (out) => Number(endsWithQuestion(out.reply)),
    // AI judge, on every case: was asking (or not asking) the right call? Its reason is in the trace.
    questionJudgement: (out, _exp, data) => judgeQuestion(data as CoachTurnInput, out),
    // Every tool call was valid the first time (no rejected input, no retry round trip).
    validCalls: (out) => Number(out.invalidCalls === 0),
    // Not pass/fail: how big the coach's context was, charted run over run.
    inputTokens: (out) => out.inputTokens,
  },
  // 3 tries per case: the coach varies run to run, so a behaviour counts only if it holds.
  config: { concurrencyLimit: 3, trials: 3 },
});
