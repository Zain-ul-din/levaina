import { stripAskTags } from "./ask-tag";
import type { ChatUIMessage } from "./types";

/** Joins every text part of a message as plain text (reasoning, tool parts and <ask> tags are dropped). */
export function getMessageText(message: ChatUIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => stripAskTags(part.text))
    .join("\n\n");
}
