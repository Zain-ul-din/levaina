import type { MemoryCategory } from "./types";

/** How each category is named to the user. Order here is the display order. */
export const CATEGORY_LABELS: Record<MemoryCategory, string> = {
  condition: "Conditions",
  doctor_instruction: "Doctor's instructions",
  medication: "Medication",
  goal: "Goals",
  body_metric: "Body",
  symptom: "Symptoms",
  food_reaction: "Food reactions",
  preference: "Preferences",
  constraint: "Practical limits",
  other: "Other",
};
