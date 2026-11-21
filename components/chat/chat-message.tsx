import type { ChatUIMessage } from "@/lib/chat/types";
import { AssistantMessage } from "./assistant-message";
import { UserMessage } from "./user-message";

type ChatMessageProps = {
  message: ChatUIMessage;
  isStreaming: boolean;
};

export function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  return message.role === "user" ? (
    <UserMessage message={message} />
  ) : (
    <AssistantMessage message={message} isStreaming={isStreaming} />
  );
}
