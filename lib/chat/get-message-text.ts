import type { ChatUIMessage } from "./types";

/** Joins every text part of a message (reasoning and tool parts are skipped). */
export function getMessageText(message: ChatUIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("\n\n");
}
