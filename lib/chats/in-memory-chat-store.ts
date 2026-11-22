import type { ChatUIMessage } from "@/lib/chat/types";
import type { ChatStore, ChatSummary, ListChatsOptions, SaveMessagesInput } from "./chat-store";

/** Test/eval double: same behaviour as the Supabase store, kept in a Map. */
export class InMemoryChatStore implements ChatStore {
  private readonly chats = new Map<string, { id: string; userId: string; title: string | null; messages: ChatUIMessage[]; updatedAt: string }>();

  private key = (userId: string, chatId: string) => `${userId}/${chatId}`;

  async load(userId: string, chatId: string) {
    const chat = this.chats.get(this.key(userId, chatId));
    return chat ? structuredClone(chat.messages) : null;
  }

  async saveMessages(userId: string, chatId: string, { from, messages, title }: SaveMessagesInput) {
    const key = this.key(userId, chatId);
    const chat = this.chats.get(key) ?? { id: chatId, userId, title: title ?? null, messages: [], updatedAt: "" };
    chat.messages = [...chat.messages.slice(0, from), ...structuredClone(messages)];
    chat.updatedAt = new Date().toISOString();
    this.chats.set(key, chat);
  }

  async list(userId: string, { limit, before }: ListChatsOptions): Promise<ChatSummary[]> {
    return [...this.chats.values()]
      .filter((chat) => chat.userId === userId && (!before || chat.updatedAt < before))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, limit)
      .map(({ id, title, updatedAt }) => ({ id, title: title ?? "New chat", updatedAt }));
  }

  async remove(userId: string, chatId: string) {
    return this.chats.delete(this.key(userId, chatId));
  }
}
