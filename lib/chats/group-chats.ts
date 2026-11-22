import type { ChatSummary } from "./chat-store";

export type ChatGroup = { label: string; chats: ChatSummary[] };

const DAY_MS = 24 * 60 * 60 * 1000;
const monthFormat = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" });

/** Local midnight, so "Today" and "Yesterday" follow the user's own day, not UTC's. */
const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

function labelFor(updatedAt: Date, now: Date): string {
  const daysAgo = Math.round((startOfDay(now) - startOfDay(updatedAt)) / DAY_MS);
  if (daysAgo <= 0) return "Today";
  if (daysAgo === 1) return "Yesterday";
  if (daysAgo < 7) return "Previous 7 days";
  if (daysAgo < 30) return "Previous 30 days";
  return monthFormat.format(updatedAt);
}

/** Chats (already newest first) in recency groups: Today, Yesterday, Previous 7 days, …, then by month. */
export function groupChatsByRecency(chats: ChatSummary[], now: Date): ChatGroup[] {
  const groups: ChatGroup[] = [];
  for (const chat of chats) {
    const label = labelFor(new Date(chat.updatedAt), now);
    const last = groups.at(-1);
    if (last?.label === label) last.chats.push(chat);
    else groups.push({ label, chats: [chat] });
  }
  return groups;
}
