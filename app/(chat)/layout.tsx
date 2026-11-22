import { ChatHistoryProvider } from "@/components/chats/chat-history-context";
import { ChatSidebar } from "@/components/chats/chat-sidebar";

/**
 * Shared by the new-chat page and saved chats (/c/<id>). The sidebar lives here, above the pages,
 * so it stays put (no reload, scroll kept) while you move between chats. On phones it's hidden
 * and the header button opens the same list as a drawer.
 */
export default function ChatLayout({ children }: LayoutProps<"/">) {
  return (
    <ChatHistoryProvider>
      <div className="flex h-dvh w-full">
        <ChatSidebar />
        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </ChatHistoryProvider>
  );
}
