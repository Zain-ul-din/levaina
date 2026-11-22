import type { ChatUIMessage } from "@/lib/chat/types";
import type { ChatStore, SaveMessagesInput } from "./chat-store";

/** Test/eval double: same behaviour as the Supabase store, kept in a Map. */
export class InMemoryChatStore implements ChatStore {
  private readonly chats = new Map<string, { title: string | null; messages: ChatUIMessage[] }>();

  private key = (userId: string, chatId: string) => `${userId}/${chatId}`;

  async load(userId: string, chatId: string) {
    const chat = this.chats.get(this.key(userId, chatId));
    return chat ? structuredClone(chat.messages) : null;
  }

  async saveMessages(userId: string, chatId: string, { from, messages, title }: SaveMessagesInput) {
    const key = this.key(userId, chatId);
    const chat = this.chats.get(key) ?? { title: title ?? null, messages: [] };
    chat.messages = [...chat.messages.slice(0, from), ...structuredClone(messages)];
    this.chats.set(key, chat);
  }
}
