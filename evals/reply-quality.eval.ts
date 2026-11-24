/**
 * Reply experience, scored by people (not an AI judge): does the coach make people want to come back?
 * 15 replies: 11 golden cases across every tier (all red flags included) and 4 experience cases
 * with real history. Each reply is scored pass/fail (or not applicable) on six qualities:
 *
 *   empathy   notices how they feel, not just the symptom (no hollow "so sorry!!")
 *   tone      warm and light: calm like a friend, never alarming, heavy or preachy
 *   specific  uses their foods, history and goal, not advice for anyone
 *   progress  shows them something they couldn't see themselves (a pattern, how far they've come)
 *   nextStep  one small thing they can do today, not a to-do list
 *   comeBack  a light, positive reason to come back
 *
 * Serious news stays clear about what to do and calm in how it's said.
 * Laminar's UI can't take human scores: score with the scoring page, scores are written back via the API.
 *   npx lmnr eval evals/reply-quality.eval.ts
 */
// Plain script, not Next.js: load .env ourselves (Mistral + Laminar keys). Built into Node, no dotenv.
process.loadEnvFile(".env");

import { evaluate, HumanEvaluator, LaminarAiSdkTelemetry } from "@lmnr-ai/lmnr";
import { registerTelemetry } from "ai";
import { GOLDEN_CASES } from "./golden/cases";
import { EXPERIENCE_CASES } from "./golden/experience-cases";
import { runCoachTurn, type CoachTurn, type CoachTurnInput } from "./lib/run-coach";

// instrumentation.ts only runs inside Next.js: register tracing here so each reply has its trace.
registerTelemetry(new LaminarAiSdkTelemetry());

export const QUALITIES = ["empathy", "tone", "specific", "progress", "nextStep", "comeBack"] as const;

/** Golden cases whose replies matter most for experience: every tier, every red flag. */
const PICKED = [
  "easy-condition",
  "easy-question",
  "easy-weigh-in",
  "medium-log-and-remember",
  "medium-habit",
  "hard-underweight-wants-to-lose",
  "hard-doctor-vs-gut",
  "extreme-blood",
  "extreme-black-stool",
  "extreme-unexplained-loss",
  "extreme-crash-diet",
];

const data = [
  ...GOLDEN_CASES.filter((c) => PICKED.includes(c.id)).map((c) => ({ id: c.id, tier: c.tier, input: c.input, golden: c.golden })),
  ...EXPERIENCE_CASES.map((c) => ({ id: c.id, tier: "experience", input: c.input, golden: c.golden })),
].map((c) => ({ data: c.input, metadata: { id: c.id, tier: c.tier, golden: c.golden } }));

/** Pass or fail; "not applicable" is simply left unscored. */
const passFail = () =>
  new HumanEvaluator([
    { value: 0, label: "Fail" },
    { value: 1, label: "Pass" },
  ]);

evaluate<CoachTurnInput, undefined, CoachTurn>({
  name: "reply-quality",
  groupName: "reply-quality", // fixed, so every scored run charts against the last
  data,
  executor: runCoachTurn,
  evaluators: Object.fromEntries(QUALITIES.map((quality) => [quality, passFail()])),
  config: { concurrencyLimit: 3 },
});
