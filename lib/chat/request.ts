import type { ChatUIMessage } from "./types";

/** Body of POST /api/chat. The client adds timeZone to every request (see chat-provider). */
export type ChatRequestBody = {
  messages: ChatUIMessage[];
  /** IANA zone from the device, e.g. "Asia/Karachi". */
  timeZone?: string;
};

/** The device's current IANA time zone (read per request, so it follows the user when they travel). */
export function deviceTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/** Accepts only zones the runtime recognises; anything else falls back to UTC. */
export function resolveTimeZone(timeZone: unknown): string {
  if (typeof timeZone !== "string" || timeZone.length > 64) return "UTC";
  try {
    new Intl.DateTimeFormat("en-GB", { timeZone });
    return timeZone;
  } catch {
    return "UTC";
  }
}
