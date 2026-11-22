import { z } from "zod";

/*
 * Single source of truth for the log's vocabulary and shapes.
 * The chat tools, the quick-log API and the stores all validate with these schemas;
 * the database mirrors the kind/source lists in CHECK constraints (supabase/migrations).
 */

export const LOG_KINDS = ["meal", "symptom", "stool", "weight", "note"] as const;
/** chat = the coach logged it from a message; tap = the quick-log sheet. */
export const LOG_SOURCES = ["chat", "tap"] as const;

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack", "drink"] as const;

export const SYMPTOMS = [
  "bloating",
  "gas",
  "cramps",
  "stomach_pain",
  "reflux",
  "nausea",
  "constipation",
  "diarrhea",
  "fatigue",
  "other",
] as const;

/** 1 = mild, 2 = moderate, 3 = severe. */
export const SEVERITIES = [1, 2, 3] as const;

/**
 * The Bristol stool scale (1 = hard lumps … 7 = liquid) with plain names, because people
 * recognise "mushy" faster than "type 6". The number is what doctors use, so it's what we store.
 */
export const STOOL_TYPES = [
  { bristol: 1, name: "Hard pebbles" },
  { bristol: 2, name: "Lumpy" },
  { bristol: 3, name: "Cracked" },
  { bristol: 4, name: "Smooth" },
  { bristol: 5, name: "Soft pieces" },
  { bristol: 6, name: "Mushy" },
  { bristol: 7, name: "Watery" },
] as const;

/** Red and black can mean bleeding: see WARNING_STOOL_COLORS. */
export const STOOL_COLORS = ["brown", "yellow", "green", "pale", "red", "black"] as const;
export const WARNING_STOOL_COLORS: readonly StoolColor[] = ["red", "black"];

export type LogKind = (typeof LOG_KINDS)[number];
export type LogSource = (typeof LOG_SOURCES)[number];
export type MealType = (typeof MEAL_TYPES)[number];
export type Symptom = (typeof SYMPTOMS)[number];
export type StoolColor = (typeof STOOL_COLORS)[number];

const shortText = (max: number) => z.string().trim().min(1).max(max);

export const mealDetailsSchema = z.object({
  description: shortText(500).describe("What they ate or drank, in their words, e.g. 'dal and rice with raita'."),
  foods: z
    .array(shortText(60))
    .max(20)
    .optional()
    .describe("Each food or drink on its own, in simple words, e.g. ['dal', 'rice', 'raita']."),
  mealType: z.enum(MEAL_TYPES).optional(),
});

export const symptomDetailsSchema = z.object({
  symptoms: z.array(z.enum(SYMPTOMS)).min(1).max(SYMPTOMS.length),
  severity: z.union(SEVERITIES.map((value) => z.literal(value))).describe("1 = mild, 2 = moderate, 3 = severe"),
  note: shortText(200).optional().describe("Anything else they said about it, e.g. 'upper belly, after eating'."),
});

export const stoolDetailsSchema = z.object({
  bristol: z
    .int()
    .min(1)
    .max(7)
    .describe(`Bristol stool type: ${STOOL_TYPES.map(({ bristol, name }) => `${bristol} = ${name.toLowerCase()}`).join(", ")}`),
  color: z.enum(STOOL_COLORS).optional(),
});

export const weightDetailsSchema = z.object({
  kg: z.number().min(20).max(400).describe("Body weight in kilograms (convert from lb or stone first)."),
});

export const noteDetailsSchema = z.object({
  text: shortText(500).describe("Something worth noting for that time that isn't a meal, symptom, stool or weight, e.g. poor sleep or stress."),
});

export const LOG_DETAILS_SCHEMAS = {
  meal: mealDetailsSchema,
  symptom: symptomDetailsSchema,
  stool: stoolDetailsSchema,
  weight: weightDetailsSchema,
  note: noteDetailsSchema,
} satisfies Record<LogKind, z.ZodObject>;

export type LogDetails<K extends LogKind = LogKind> = z.infer<(typeof LOG_DETAILS_SCHEMAS)[K]>;

/** One union member per kind, so checking `kind` narrows `details`. */
type PerKind<T> = { [K in LogKind]: { kind: K; details: LogDetails<K> } & T }[LogKind];

export type LogEntry = PerKind<{
  id: number;
  /** ISO timestamp (UTC) of when it happened. */
  loggedAt: string;
  source: LogSource;
  createdAt: string;
}>;

export type NewLogEntry = PerKind<{ loggedAt: Date; source: LogSource }>;

const entryRequest = <K extends LogKind>(kind: K) =>
  z.object({
    kind: z.literal(kind),
    details: LOG_DETAILS_SCHEMAS[kind],
    /** The device sends an exact moment (with offset), so no time zone guessing happens here. */
    loggedAt: z.iso.datetime({ offset: true }),
  });

/** Body of POST /api/log: an entry from the quick-log sheet. */
export const newLogEntryRequestSchema = z.discriminatedUnion("kind", [
  entryRequest("meal"),
  entryRequest("symptom"),
  entryRequest("stool"),
  entryRequest("weight"),
  entryRequest("note"),
]);
