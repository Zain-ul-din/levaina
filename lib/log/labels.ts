import type { LogKind, MealType, StoolColor, Symptom } from "./types";

/*
 * Words and swatches the log UI shows. Kept apart from types.ts so the vocabulary
 * (what's stored) and the presentation (how it reads) can change independently.
 */

/** Tiles on the quick-log sheet, in the order they appear. */
export const QUICK_LOG_KINDS = ["meal", "symptom", "stool", "weight"] as const satisfies readonly LogKind[];

export const KIND_LABELS: Record<LogKind, { label: string; emoji: string; hint: string }> = {
  meal: { label: "Meal", emoji: "🍲", hint: "What you ate or drank" },
  symptom: { label: "Symptom", emoji: "🌀", hint: "Bloating, pain, reflux…" },
  stool: { label: "Stool", emoji: "🚽", hint: "Shape and colour" },
  weight: { label: "Weight", emoji: "⚖️", hint: "A weigh-in" },
  note: { label: "Note", emoji: "✏️", hint: "Sleep, stress, anything else" },
};

export const SYMPTOM_LABELS: Record<Symptom, string> = {
  bloating: "Bloating",
  gas: "Gas",
  cramps: "Cramps",
  stomach_pain: "Stomach pain",
  reflux: "Reflux",
  nausea: "Nausea",
  constipation: "Constipation",
  diarrhea: "Diarrhoea",
  fatigue: "Tiredness",
  other: "Other",
};

export const SEVERITY_LABELS = { 1: "Mild", 2: "Moderate", 3: "Severe" } as const;

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
  drink: "Drink",
};

/** Swatches are the colours themselves (they mean the stool colour), so they're fixed, not theme tokens. */
export const STOOL_COLOR_SWATCHES: Record<StoolColor, { label: string; swatch: string }> = {
  brown: { label: "Brown", swatch: "#8a5a3b" },
  yellow: { label: "Yellow", swatch: "#d9a93a" },
  green: { label: "Green", swatch: "#6f8a3a" },
  pale: { label: "Pale", swatch: "#e6dcc6" },
  red: { label: "Red", swatch: "#b8432f" },
  black: { label: "Black", swatch: "#2b2620" },
};
