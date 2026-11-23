"use client";

import { Button } from "@/components/ui/button";
import { TraceLine, TraceTitle } from "@/components/ui/trace";
import type { ChatSummary } from "@/lib/chats/chat-store";
import { chatTimeLabel } from "@/lib/chats/chat-time";
import { groupChatsByRecency } from "@/lib/chats/group-chats";
import { cn } from "@/lib/utils";
import { NotePencilIcon, TrashSimpleIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useChatHistory } from "./chat-history-context";
import type { useChats } from "./use-chats";

/** The chat being viewed, from the URL (/c/<id>); null on a new, unsaved chat. */
function useActiveChatId() {
  const pathname = usePathname();
  return /^\/c\/([^/]+)$/.exec(pathname)?.[1] ?? null;
}

type ChatHistoryListProps = {
  history: ReturnType<typeof useChats>;
  /** Called after any choice that should close a drawer (opening a chat, New chat). */
  onDone?: () => void;
};

/**
 * "New chat" plus past chats grouped by recency. The same list lives in the docked desktop
 * sidebar and in the phone drawer; only the container around it differs.
 */
export function ChatHistoryList({ history, onDone }: ChatHistoryListProps) {
  const { chats, status, error, loadedAt, hasMore, isLoadingMore, loadMore, remove } = history;
  const { newChat: startNewChat } = useChatHistory();
  const activeId = useActiveChatId();

  const newChat = () => {
    onDone?.();
    startNewChat();
  };

  const deleteChat = async (chat: ChatSummary) => {
    await remove(chat);
    // Deleting the chat on screen leaves nothing to show: start fresh instead.
    if (chat.id === activeId) newChat();
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* The main action: a filled pill whose edges line up with the header (20px in). */}
      <div className="px-5 pt-2 pb-3">
        <button
          type="button"
          onClick={newChat}
          className="pressable flex h-12 w-full items-center gap-3 rounded-full bg-card px-4 text-[0.95rem] font-medium shadow-soft outline-none hover:bg-card/80 focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <NotePencilIcon weight="duotone" className="size-5 text-primary" />
          New chat
        </button>
      </div>

      <nav
        aria-label="Past chats"
        // No scrollbar gutter: delete buttons line up under the header's close button on every device.
        className="scrollbar-none min-h-0 flex-1 overflow-y-auto px-2 pb-[max(1rem,env(safe-area-inset-bottom))]"
      >
        {error && (
          <p role="alert" className="px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        {(status === "loading" || status === "idle") && (
          <div className="px-3 py-2">
            <TraceLine status="running">
              <TraceTitle>Loading</TraceTitle>
            </TraceLine>
          </div>
        )}
        {status === "ready" && chats.length === 0 && (
          <p className="px-3 py-6 text-[0.95rem] leading-relaxed text-muted-foreground">
            Your conversations will show up here, so you can pick one up again later.
          </p>
        )}
        {status === "ready" &&
          loadedAt &&
          groupChatsByRecency(chats, loadedAt).map((group) => (
            <section key={group.label} className="mt-5 first:mt-2">
              <h3 className="px-3 pb-1.5 text-[0.8125rem] font-medium text-muted-foreground">{group.label}</h3>
              <ul className="flex flex-col gap-0.5">
                {group.chats.map((chat) => (
                  <ChatRow
                    key={chat.id}
                    chat={chat}
                    isActive={chat.id === activeId}
                    when={chatTimeLabel(chat.updatedAt, loadedAt)}
                    onOpen={() => onDone?.()}
                    onDelete={() => deleteChat(chat)}
                  />
                ))}
              </ul>
            </section>
          ))}
        {status === "ready" && hasMore && (
          <Button
            variant="ghost"
            className="mt-3 h-10 w-full rounded-xl text-muted-foreground"
            disabled={isLoadingMore}
            onClick={loadMore}
          >
            {isLoadingMore ? "Loading…" : "Show older chats"}
          </Button>
        )}
      </nav>
    </div>
  );
}

type ChatRowProps = {
  chat: ChatSummary;
  isActive: boolean;
  /** When it was last used, already shortened for its group (a time, weekday or date). */
  when: string;
  onOpen: () => void;
  onDelete: () => void;
};

/** A chat's title as a link; deleting asks first in place, because it can't be undone. */
function ChatRow({ chat, isActive, when, onOpen, onDelete }: ChatRowProps) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      // Scrolled fully into view when it appears: it may open half hidden in a scrolled list.
      <li ref={(row) => row?.scrollIntoView({ block: "nearest" })} className="flex flex-col gap-2 rounded-xl bg-card px-3 py-3 shadow-soft">
        <p className="text-sm leading-snug">
          Delete <span className="font-medium">{chat.title}</span>? This can&apos;t be undone.
        </p>
        {/* Thumb-sized; Delete is solid red because this is the step that can't be undone. */}
        <div className="flex gap-2">
          <Button
            onClick={onDelete}
            autoFocus
            className="h-10 rounded-full bg-destructive px-5 text-primary-foreground hover:bg-destructive/90"
          >
            Delete
          </Button>
          <Button variant="ghost" onClick={() => setConfirming(false)} className="h-10 rounded-full px-5">
            Cancel
          </Button>
        </div>
      </li>
    );
  }

  return (
    <li className="group/chat relative">
      <Link
        href={`/c/${chat.id}`}
        // The open chat is just closed over, not reloaded.
        onClick={(event) => {
          if (isActive) event.preventDefault();
          onOpen();
        }}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          // pr-14: room for the delete button, so a long title stops before it.
          "flex min-h-14 flex-col justify-center rounded-xl py-2 pr-14 pl-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          isActive ? "bg-card shadow-soft" : "hover:bg-card/70",
        )}
      >
        <span className={cn("truncate text-[0.95rem] leading-snug", isActive && "font-medium")}>{chat.title}</span>
        <span className="text-xs leading-snug text-muted-foreground">{when}</span>
      </Link>
      {/* Red: it deletes. Visible on touch screens (no hover); on desktop on hover or keyboard focus.
          right-3: its centre sits 40px from the edge, under the header's close button. */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-1/2 right-3 size-10 -translate-y-1/2 rounded-full text-destructive opacity-100 hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 pointer-fine:opacity-0 pointer-fine:group-hover/chat:opacity-100 [&_svg]:size-[18px]"
        aria-label={`Delete chat: ${chat.title}`}
        onClick={() => setConfirming(true)}
      >
        <TrashSimpleIcon weight="duotone" />
      </Button>
    </li>
  );
}
