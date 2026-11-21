import type { UIMessage } from "ai";

/** Extra data the server attaches to each assistant message. */
export type ChatMessageMetadata = {
  /** How long the model spent reasoning, in milliseconds. */
  reasoningDuration?: number;
};

/** The one message type shared by the API route and the UI. */
export type ChatUIMessage = UIMessage<ChatMessageMetadata>;

export type ChatMessagePart = ChatUIMessage["parts"][number];
