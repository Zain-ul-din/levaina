import { ChatContainer } from "@/components/chat/chat-container";
import { getChatStore } from "@/lib/chats/get-chat-store";
import { getCurrentUserId } from "@/lib/server/current-user";
import { notFound } from "next/navigation";
import { Suspense } from "react";

type SavedChatPageProps = { params: Promise<{ id: string }> };

/**
 * Reopens a saved chat. With Cache Components, request data (params, the database) must be read
 * inside <Suspense>: the page shell is sent at once and the chat streams in when loaded.
 */
export default function SavedChatPage({ params }: SavedChatPageProps) {
  return (
    <Suspense fallback={null}>
      <SavedChat params={params} />
    </Suspense>
  );
}

/** Someone else's (or a made-up) id is simply not found. */
async function SavedChat({ params }: SavedChatPageProps) {
  const { id } = await params;
  const messages = await (await getChatStore()).load(await getCurrentUserId(), id);
  if (!messages) notFound();

  // key: switching from one saved chat to another starts a fresh chat state, never a mix of both.
  return <ChatContainer key={id} chatId={id} initialMessages={messages} />;
}
