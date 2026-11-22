import { describeEntry } from "@/lib/log/describe-entry";
import { getLogStore } from "@/lib/log/get-log-store";
import { LOG_PAGE_DAYS, type AddLogEntryResponse, type LogPageResponse } from "@/lib/log/log-api";
import { checkLogTime } from "@/lib/log/log-time";
import { safetyNoteFor } from "@/lib/log/safety";
import { newLogEntryRequestSchema, type NewLogEntry } from "@/lib/log/types";
import { getCurrentUserId } from "@/lib/server/current-user";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * One page of the log for the log sheet: everything in the LOG_PAGE_DAYS before `until` (default: now),
 * newest first. Pages are time windows, not "N rows", so entries sharing a timestamp can't fall between pages.
 */
export async function GET(req: Request) {
  const untilParam = new URL(req.url).searchParams.get("until");
  const until = untilParam ? new Date(untilParam) : null;
  if (until && Number.isNaN(until.getTime())) return Response.json({ error: "Invalid date." }, { status: 400 });

  const [store, userId] = await Promise.all([getLogStore(), getCurrentUserId()]);
  const end = until ?? new Date(Date.now() + DAY_MS); // default includes anything logged "just now" on a fast clock
  const since = new Date((until ?? new Date()).getTime() - LOG_PAGE_DAYS * DAY_MS);

  const [entries, older] = await Promise.all([
    // Generous cap: two weeks of heavy logging (15+ a day) must not be cut off mid-window.
    store.list(userId, { since, until: end, limit: 1000 }),
    store.list(userId, { since: new Date(0), until: since, limit: 1 }),
  ]);
  return Response.json({ entries, since: since.toISOString(), hasMore: older.length > 0 } satisfies LogPageResponse);
}

/** Adds one entry from the quick-log sheet. Same schemas and time rules as the coach's log tools. */
export async function POST(req: Request) {
  const parsed = newLogEntryRequestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "That entry isn't complete." }, { status: 400 });

  const loggedAt = new Date(parsed.data.loggedAt);
  const problem = checkLogTime(loggedAt, new Date());
  if (problem) return Response.json({ error: problem }, { status: 400 });

  const entry = await (await getLogStore()).add(await getCurrentUserId(), {
    ...parsed.data,
    loggedAt,
    source: "tap",
  } as NewLogEntry);

  return Response.json(
    { entry, text: describeEntry(entry), safetyNote: safetyNoteFor(entry) } satisfies AddLogEntryResponse,
    { status: 201 },
  );
}
