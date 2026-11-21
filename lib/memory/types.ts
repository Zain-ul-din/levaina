import { z } from "zod";

/*
 * Single source of truth for memory vocabulary in TypeScript.
 * The database mirrors these lists in CHECK constraints (supabase/migrations);
 * when one changes, change the other in the same commit.
 */

/** Fact = true about the user now (superseded when it changes). Episode = happened on a date. */
export const MEMORY_KINDS = ["fact", "episode"] as const;

export const MEMORY_CATEGORIES = [
  "condition",
  "doctor_instruction",
  "medication",
  "goal",
  "body_metric",
  "symptom",
  "food_reaction",
  "preference",
  "constraint",
  "other",
] as const;

export const MEMORY_STATUSES = ["active", "superseded", "forgotten"] as const;

export type MemoryKind = (typeof MEMORY_KINDS)[number];
export type MemoryCategory = (typeof MEMORY_CATEGORIES)[number];
export type MemoryStatus = (typeof MEMORY_STATUSES)[number];

export type Memory = {
  id: number;
  kind: MemoryKind;
  category: MemoryCategory;
  content: string;
  /** ISO date (YYYY-MM-DD); set for episodes only. */
  occurredOn: string | null;
  status: MemoryStatus;
  createdAt: string;
};

export const memoryContentSchema = z
  .string()
  .trim()
  .min(1)
  .max(500)
  .describe("One short sentence in plain words, e.g. 'Doctor recommended a low-FODMAP diet for 6 weeks'.");

export const newMemorySchema = z.object({
  kind: z.enum(MEMORY_KINDS).describe("fact = true now; episode = something that happened on a date"),
  category: z.enum(MEMORY_CATEGORIES),
  content: memoryContentSchema,
  occurredOn: z.iso
    .date()
    .optional()
    .describe("Required for episodes: the date it happened (YYYY-MM-DD). Omit for facts."),
});

export type NewMemory = z.infer<typeof newMemorySchema>;
