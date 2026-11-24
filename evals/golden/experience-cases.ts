/**
 * Experience cases: situations with real history (memories and a log), so the qualities that need
 * context can show: is the reply specific to them, does it show progress or a pattern, is it
 * caring when they're frustrated? Scored by people with the experience rubric (reply-quality eval).
 * Today is Monday 23 Nov 2026, 15:00 in Karachi (see EVAL_NOW).
 */
import type { NewLogEntry } from "@/lib/log/types";
import type { NewMemory } from "@/lib/memory/types";
import type { CoachTurnInput } from "../lib/run-coach";

export type ExperienceCase = {
  id: string;
  input: CoachTurnInput;
  /** What a great reply does here, in plain words: what a person scores against. */
  golden: string;
};

const at = (localIso: string) => new Date(`${localIso}:00+05:00`); // Karachi is UTC+5
const meal = (when: string, description: string, foods: string[], mealType: "breakfast" | "lunch" | "dinner" | "snack"): NewLogEntry => ({
  kind: "meal",
  source: "chat",
  loggedAt: at(when),
  details: { description, foods, mealType },
});
const bloated = (when: string, severity: 1 | 2 | 3): NewLogEntry => ({
  kind: "symptom",
  source: "chat",
  loggedAt: at(when),
  details: { symptoms: ["bloating"], severity },
});
const weighed = (when: string, kg: number): NewLogEntry => ({ kind: "weight", source: "tap", loggedAt: at(when), details: { kg } });

const IBS: NewMemory = { kind: "fact", category: "condition", content: "Has IBS" };
const GAIN_GOAL: NewMemory = { kind: "fact", category: "goal", content: "Wants to gain about 3 kg, gently" };

/** A week with a pattern in it: pulses at dinner, bloating after, twice. */
const PULSES_WEEK: NewLogEntry[] = [
  meal("2026-11-21T20:00", "Lentil dal with rice", ["lentils", "rice"], "dinner"),
  bloated("2026-11-21T21:30", 2),
  meal("2026-11-22T13:00", "Chicken and rice", ["chicken", "rice"], "lunch"),
  meal("2026-11-22T20:30", "Chickpea curry with roti", ["chickpeas", "roti"], "dinner"),
  bloated("2026-11-22T22:00", 2),
];

export const EXPERIENCE_CASES: ExperienceCase[] = [
  {
    id: "experience-fed-up",
    input: { message: "bloated again after dinner. honestly so fed up with this", remembered: [IBS, GAIN_GOAL], logs: PULSES_WEEK },
    golden:
      "Acknowledges how tiring this is first. Points out the pattern (pulses at dinner, bloating after, twice). One small thing to try tonight, and a light reason to report back.",
  },
  {
    id: "experience-small-win",
    input: {
      message: "I put on half a kilo this week!",
      remembered: [GAIN_GOAL],
      logs: [weighed("2026-11-16T08:00", 51.5), weighed("2026-11-23T08:00", 52)],
    },
    golden:
      "Celebrates warmly (not over the top). Shows progress against the 3 kg goal. Keeps the momentum with one gentle next step.",
  },
  {
    id: "experience-giving-up",
    input: { message: "nothing works. I give up", remembered: [IBS, GAIN_GOAL], logs: PULSES_WEEK },
    golden:
      "Care first: validates the frustration without being heavy. Shows something hopeful from their own log (there is a pattern to work with). One tiny, doable step. No lecture.",
  },
  {
    id: "experience-is-it-dairy",
    input: {
      message: "is it the dairy?",
      remembered: [IBS],
      logs: [
        meal("2026-11-20T09:00", "Milk tea and toast", ["milk", "tea", "toast"], "breakfast"),
        bloated("2026-11-20T10:30", 2),
        meal("2026-11-21T09:00", "Milk tea and paratha", ["milk", "tea", "paratha"], "breakfast"),
        bloated("2026-11-21T10:00", 2),
        meal("2026-11-22T09:00", "Black tea and toast", ["tea", "toast"], "breakfast"),
      ],
    },
    golden:
      "Answers from their log honestly: bloated after milk tea twice, not after black tea once. Suggestive, not proof. Suggests a simple test (lactose-free milk for a few days) and checking back.",
  },
];
