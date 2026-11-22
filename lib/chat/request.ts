import type { ChatUIMessage } from "./types";

/**
 * Body of POST /api/chat. The client sends only the new message; the server keeps the history
 * (see chat-provider and the route). Resending a message the server already has (a retry or a
 * regenerated reply) replaces it and everything after it.
 */
export type ChatRequestBody = {
  /** The chat's id, made on the device. */
  id: string;
  message: ChatUIMessage;
  /** IANA zone from the device, e.g. "Asia/Karachi". */
  timeZone?: string;
};

const CHAT_ID = /^[A-Za-z0-9_-]{1,64}$/;

/** Checks the shape of an untrusted request body; null if it isn't a valid user message. */
export function parseChatRequest(body: unknown): ChatRequestBody | null {
  if (!body || typeof body !== "object") return null;
  const { id, message, timeZone } = body as Record<string, unknown>;
  if (typeof id !== "string" || !CHAT_ID.test(id)) return null;
  if (!message || typeof message !== "object") return null;
  const { id: messageId, role, parts } = message as Record<string, unknown>;
  // Only user messages come from the device; assistant messages are written by the server alone.
  if (typeof messageId !== "string" || !CHAT_ID.test(messageId) || role !== "user" || !Array.isArray(parts)) return null;
  return { id, message: message as ChatUIMessage, timeZone: typeof timeZone === "string" ? timeZone : undefined };
}

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
