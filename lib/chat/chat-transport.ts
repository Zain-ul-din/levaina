import { DefaultChatTransport, generateId } from "ai";
import { deviceTimeZone, type ChatRequestBody } from "./request";
import type { ChatUIMessage } from "./types";

/** The address of a saved chat; reloading it reopens the conversation. */
export const chatPath = (chatId: string) => `/c/${chatId}`;

/**
 * The device side of a saved chat: which chat we're in, and how messages are sent.
 *
 * - Sends only the newest message: the server keeps the history and saves each turn.
 * - A new chat gets its id when its first message is sent (an event, never a render, since random
 *   values can't be prerendered), and the address quietly becomes /c/<id> at that moment.
 * - The device's time zone goes along, so the coach knows the user's local time.
 */
export function createChatSession(savedChatId?: string) {
  let chatId = savedChatId;

  const transport = new DefaultChatTransport<ChatUIMessage>({
    api: "/api/chat",
    prepareSendMessagesRequest: ({ messages }) => {
      chatId ??= generateId();
      if (window.location.pathname !== chatPath(chatId)) window.history.replaceState(null, "", chatPath(chatId));
      return {
        body: { id: chatId, message: messages.at(-1)!, timeZone: deviceTimeZone() } satisfies ChatRequestBody,
      };
    },
  });

  return {
    transport,
    /** Forget the current chat; the next message starts (and names) a new one. */
    startNew: () => {
      chatId = undefined;
    },
  };
}
