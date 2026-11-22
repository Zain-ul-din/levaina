import { STOOL_TYPES, type LogContent } from "./types";

const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const SEVERITY_WORDS = { 1: "mild", 2: "moderate", 3: "severe" } as const;

/** "Mushy" for Bristol 6: the plain name people picked from. */
export const stoolTypeName = (bristol: number) =>
  STOOL_TYPES.find((type) => type.bristol === bristol)?.name ?? `Type ${bristol}`;

/**
 * One short line for an entry, the same everywhere it's shown (chat chip, log sheet, coach prompt):
 * "Lunch: dal and rice", "Bloating, gas (moderate)", "Mushy (type 6), yellow", "61.2 kg".
 */
export function describeEntry(entry: LogContent): string {
  switch (entry.kind) {
    case "meal": {
      const { mealType, description } = entry.details;
      return mealType ? `${capitalize(mealType)}: ${description}` : description;
    }
    case "symptom": {
      const { symptoms, severity, note } = entry.details;
      const names = capitalize(symptoms.map((symptom) => symptom.replace("_", " ")).join(", "));
      return `${names} (${SEVERITY_WORDS[severity]})${note ? `: ${note}` : ""}`;
    }
    case "stool": {
      // Shape or colour may be missing (people often mention only one), but not both in practice.
      const { bristol, color } = entry.details;
      const shape = bristol ? `${stoolTypeName(bristol)} (type ${bristol})` : "Stool";
      return color ? `${shape}, ${color}` : shape;
    }
    case "weight":
      return `${entry.details.kg} kg`;
    case "note":
      return entry.details.text;
  }
}
