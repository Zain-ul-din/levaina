/** Browser-side calls to the log API, and the response shapes shared with the routes. */
import type { LogContent, LogEntry } from "./types";

/** Body of a successful POST /api/log. */
export type AddLogEntryResponse = { entry: LogEntry; text: string; safetyNote?: string };

/** How many days one page of the log sheet covers. */
export const LOG_PAGE_DAYS = 14;

/** Body of GET /api/log: one time window of entries, newest first. */
export type LogPageResponse = {
  entries: LogEntry[];
  /** Start of this window; pass it as `until` to get the window before it. */
  since: string;
  hasMore: boolean;
};

export async function fetchLogPageRequest(until?: string, signal?: AbortSignal): Promise<LogPageResponse> {
  const query = until ? `?until=${encodeURIComponent(until)}` : "";
  const response = await fetch(`/api/log${query}`, { signal });
  if (!response.ok) throw new Error(await messageFrom(response, "Couldn't load your log. Try again."));
  return (await response.json()) as LogPageResponse;
}

/** What the quick-log sheet sends: the content plus an exact moment (with offset). */
export type AddLogEntryInput = LogContent & { loggedAt: string };

const messageFrom = async (response: Response, fallback: string) => {
  const body = (await response.json().catch(() => null)) as { error?: string } | null;
  return body?.error ?? fallback;
};

export async function addLogEntryRequest(input: AddLogEntryInput): Promise<AddLogEntryResponse> {
  const response = await fetch("/api/log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await messageFrom(response, "Couldn't save that. Try again."));
  return (await response.json()) as AddLogEntryResponse;
}

export async function removeLogEntryRequest(id: number): Promise<void> {
  const response = await fetch(`/api/log/${id}`, { method: "DELETE" });
  if (!response.ok) throw new Error("Couldn't remove that entry. Try again.");
}
