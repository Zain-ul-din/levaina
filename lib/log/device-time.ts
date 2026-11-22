/*
 * Time on the device, for the quick-log sheet. A datetime-local input speaks the device's
 * wall-clock time ("2026-11-22T13:05"); the API wants an exact moment.
 */

const pad = (value: number) => String(value).padStart(2, "0");

/** A Date → the value a datetime-local input shows, in the device's zone. */
export function toLocalInputValue(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** A datetime-local value → an exact ISO moment (the browser reads it in the device's zone). */
export function localInputToIso(value: string): string | null {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

/** A sensible meal type for the time of day, so the usual case is one tap fewer. */
export function mealTypeForHour(hour: number) {
  if (hour >= 5 && hour < 11) return "breakfast" as const;
  if (hour >= 11 && hour < 16) return "lunch" as const;
  if (hour >= 18 && hour < 23) return "dinner" as const;
  return "snack" as const;
}
