/*
 * Time helpers for the log. The coach speaks in the user's wall-clock time ("13:00 today"),
 * the database stores exact moments (UTC). These convert between the two using the
 * user's IANA time zone, with Intl only (no date library).
 */

const LOCAL_DATE_TIME = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

/** How far ahead of "now" an entry may be: absorbs clock drift between device and server. */
const FUTURE_TOLERANCE_MS = 10 * 60 * 1000;
/** Older entries are almost always a mistake (wrong year or month); the coach can ask instead. */
export const MAX_LOG_AGE_DAYS = 30;

/** Milliseconds the zone is ahead of UTC at that moment (e.g. +5h for Asia/Karachi). */
function zoneOffsetMs(epochMs: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(epochMs));
  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  const wallClockAsUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
  return wallClockAsUtc - Math.floor(epochMs / 1000) * 1000;
}

/**
 * "2026-11-22T13:00" in Asia/Karachi → the Date for 08:00 UTC.
 * Returns null for malformed or impossible input (e.g. 31 February).
 */
export function localDateTimeToDate(local: string, timeZone: string): Date | null {
  const match = LOCAL_DATE_TIME.exec(local);
  if (!match) return null;
  const [year, month, day, hour, minute] = match.slice(1).map(Number);
  const asUtc = Date.UTC(year, month - 1, day, hour, minute);
  const check = new Date(asUtc);
  if (check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day || hour > 23 || minute > 59) return null;

  // Two passes: the offset at the guessed moment can differ from the first estimate around DST changes.
  const firstGuess = asUtc - zoneOffsetMs(asUtc, timeZone);
  return new Date(asUtc - zoneOffsetMs(firstGuess, timeZone));
}

/** Why a log time is rejected, phrased for the coach or the user; null when it's fine. */
export function checkLogTime(loggedAt: Date, now: Date): string | null {
  if (Number.isNaN(loggedAt.getTime())) return "That time isn't valid.";
  if (loggedAt.getTime() > now.getTime() + FUTURE_TOLERANCE_MS) return "That time is in the future; only log what already happened.";
  if (now.getTime() - loggedAt.getTime() > MAX_LOG_AGE_DAYS * 24 * 60 * 60 * 1000) {
    return `That's more than ${MAX_LOG_AGE_DAYS} days ago; check the date.`;
  }
  return null;
}

/** "Sunday 22 November" in the user's zone: the day heading for log lists and the prompt. */
export function formatLogDay(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone, weekday: "long", day: "numeric", month: "long" }).format(date);
}

/** "13:05" in the user's zone. */
export function formatLogClock(date: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(date);
}
