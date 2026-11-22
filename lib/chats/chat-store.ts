import type { ChatUIMessage } from "@/lib/chat/types";

/** One turn to save: messages that replace everything from `from` (a position) onwards. */
export type SaveMessagesInput = {
  from: number;
  messages: ChatUIMessage[];
  /** Set only when the chat is created; later saves keep the existing title. */
  title?: string;
};

/** One row of the chat list: enough to show and open it. */
export type ChatSummary = {
  id: string;
  title: string;
  /** ISO time of the last saved turn; the list is sorted by it. */
  updatedAt: string;
};

export type ListChatsOptions = {
  limit: number;
  /** Only chats last updated before this ISO time (the previous page's last updatedAt). */
  before?: string;
};

/**
 * Persistence boundary for conversations. The chat route depends on this interface,
 * never on Supabase directly, so evals can run on the in-memory version.
 */
export interface ChatStore {
  /** The chat's messages in order, or null if this user has no chat with that id. */
  load(userId: string, chatId: string): Promise<ChatUIMessage[] | null>;
  /**
   * Creates the chat if it's new, then replaces messages from `from` on. "Replace from" covers
   * a normal send (from = end), a retry after an error and a regenerated reply (from = earlier).
   */
  saveMessages(userId: string, chatId: string, input: SaveMessagesInput): Promise<void>;
  /** This user's chats, most recently active first. */
  list(userId: string, options: ListChatsOptions): Promise<ChatSummary[]>;
  /** Deletes the chat and its messages for good; false when there was no such chat. */
  remove(userId: string, chatId: string): Promise<boolean>;
}

/** Chat titles until we generate better ones: the first message, cut at a word near 60 characters. */
export function titleFromMessage(message: ChatUIMessage): string {
  const text = message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length <= 60) return text || "New chat";
  const cut = text.slice(0, 60);
  return `${cut.slice(0, cut.lastIndexOf(" ") > 30 ? cut.lastIndexOf(" ") : 60)}…`;
}
