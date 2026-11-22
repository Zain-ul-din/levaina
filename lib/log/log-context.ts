import { describeEntry } from "./describe-entry";
import type { LogStore } from "./log-store";
import { formatLogClock, formatLogDay } from "./log-time";
import type { LogEntry } from "./types";

/** What the coach sees of the log on every turn. */
export type LogContext = {
  /** Every entry from the last RECENT_DAYS days, newest first. */
  recent: LogEntry[];
  /** Weigh-ins from the last TREND_DAYS days, newest first: enough for a weekly trend. */
  weighIns: LogEntry[];
};

const DAY_MS = 24 * 60 * 60 * 1000;
export const RECENT_DAYS = 7;
const TREND_DAYS = 30;
/** Caps the prompt: a heavy logger's week stays readable, and the newest entries win. */
const RECENT_LIMIT = 150;
const WEIGH_IN_LIMIT = 30;

export const EMPTY_LOG_CONTEXT: LogContext = { recent: [], weighIns: [] };

export async function loadLogContext(store: LogStore, userId: string, now: Date): Promise<LogContext> {
  const [recent, weighIns] = await Promise.all([
    store.list(userId, { since: new Date(now.getTime() - RECENT_DAYS * DAY_MS), limit: RECENT_LIMIT }),
    store.list(userId, { since: new Date(now.getTime() - TREND_DAYS * DAY_MS), kinds: ["weight"], limit: WEIGH_IN_LIMIT }),
  ]);
  return { recent, weighIns };
}

/**
 * Renders the log for the system prompt, grouped by the user's local day, oldest first
 * (a timeline reads top to bottom). Each line carries its [id] so the coach can remove it.
 */
export function formatLogContext({ recent, weighIns }: LogContext, timeZone: string): string {
  const byDay = new Map<string, LogEntry[]>();
  for (const entry of recent.toReversed()) {
    const day = formatLogDay(new Date(entry.loggedAt), timeZone);
    byDay.set(day, [...(byDay.get(day) ?? []), entry]);
  }

  const line = (entry: LogEntry) => {
    const foods = entry.kind === "meal" && entry.details.foods?.length ? ` [foods: ${entry.details.foods.join(", ")}]` : "";
    return `- [${entry.id}] ${formatLogClock(new Date(entry.loggedAt), timeZone)} ${entry.kind}: ${describeEntry(entry)}${foods}`;
  };

  const days = [...byDay].map(([day, entries]) => `### ${day}\n${entries.map(line).join("\n")}`);
  const trend = weighIns
    .toReversed()
    .map((entry) => `${formatLogDay(new Date(entry.loggedAt), timeZone)}: ${describeEntry(entry)}`);

  return [
    `## Last ${RECENT_DAYS} days`,
    days.length ? days.join("\n\n") : "- nothing logged yet",
    "",
    `## Weigh-ins, last ${TREND_DAYS} days`,
    trend.length ? trend.map((item) => `- ${item}`).join("\n") : "- none yet",
  ].join("\n");
}
