import { WARNING_STOOL_COLORS, type LogContent } from "./types";

/**
 * Fixed-code safety checks on a log entry, so a warning sign never depends on the model noticing.
 * The same note goes to the coach (in the tool result) and to the user (on the chip and the sheet).
 */
export function safetyNoteFor(entry: LogContent): string | undefined {
  if (entry.kind === "stool" && entry.details.color && WARNING_STOOL_COLORS.includes(entry.details.color)) {
    return entry.details.color === "red"
      ? "Red in the stool can be blood. If it wasn't from something red you ate (like beetroot), please see a doctor soon."
      : "Black, tar-like stool can be a sign of bleeding. If it wasn't from iron tablets or bismuth, please see a doctor soon.";
  }
  if (entry.kind === "symptom" && entry.details.severity === 3 && entry.details.symptoms.includes("stomach_pain")) {
    return "Severe stomach pain is worth getting checked. If it's sudden, constant or getting worse, seek medical care now.";
  }
  return undefined;
}
