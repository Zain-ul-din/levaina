const DAY_MS = 24 * 60 * 60 * 1000;
const timeFormat = new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit" });
const weekdayFormat = new Intl.DateTimeFormat(undefined, { weekday: "long" });
const dateFormat = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" });

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/**
 * When a chat was last used, as short as its recency group allows: the group already says
 * "Today" or "Yesterday", so those show the time; this week shows the weekday; older, the date.
 */
export function chatTimeLabel(updatedAt: string, now: Date): string {
  const at = new Date(updatedAt);
  const daysAgo = Math.round((startOfDay(now) - startOfDay(at)) / DAY_MS);
  if (daysAgo <= 1) return timeFormat.format(at);
  if (daysAgo < 7) return weekdayFormat.format(at);
  return dateFormat.format(at);
}
