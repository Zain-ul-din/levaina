import type { ChatUIMessage } from "@/lib/chat/types";
import { AssistantMessage } from "./assistant-message";
import { UserMessage } from "./user-message";

type ChatMessageProps = {
  message: ChatUIMessage;
  isStreaming: boolean;
  /** Sent after the chat was opened (rather than loaded with it). */
  isNew?: boolean;
  showUsedMemories?: boolean;
};

export function ChatMessage({ message, isStreaming, isNew = false, showUsedMemories }: ChatMessageProps) {
  return message.role === "user" ? (
    <UserMessage message={message} isNew={isNew} />
  ) : (
    <AssistantMessage
      message={message}
      isStreaming={isStreaming}
      showUsedMemories={showUsedMemories}
    />
  );
}
