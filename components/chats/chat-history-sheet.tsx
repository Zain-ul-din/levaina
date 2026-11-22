"use client";

import { FloatingIconButton } from "@/components/brand/floating-icon-button";
import { useChatActions } from "@/components/chat/chat-provider";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { TraceLine, TraceTitle } from "@/components/ui/trace";
import type { ChatSummary } from "@/lib/chats/chat-store";
import { groupChatsByRecency } from "@/lib/chats/group-chats";
import { cn } from "@/lib/utils";
import { NotePencilIcon, SidebarSimpleIcon, TrashSimpleIcon, XIcon } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useChats } from "./use-chats";

/** The chat being viewed, from the URL (/c/<id>); null on a new, unsaved chat. */
function useActiveChatId() {
  const pathname = usePathname();
  return /^\/c\/([^/]+)$/.exec(pathname)?.[1] ?? null;
}

/**
 * Past chats in a drawer that slides over the page from the left, like ChatGPT and Claude on a phone.
 * It overlays the chat instead of pushing it, so the page layout never changes.
 */
export function ChatHistorySheet() {
  const [open, setOpen] = useState(false);
  const { chats, status, error, hasMore, isLoadingMore, load, loadMore, remove } = useChats();
  const { startNewChat } = useChatActions();
  const activeId = useActiveChatId();
  // When the drawer opened; groups ("Today", "Yesterday") are worked out from it. Set in the click
  // handler, not during render: the page is pre-rendered, and "now" there would be build time.
  const [openedAt, setOpenedAt] = useState<Date | null>(null);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setOpenedAt(new Date());
      void load();
    }
  };

  const newChat = () => {
    setOpen(false);
    startNewChat();
  };

  const deleteChat = async (chat: ChatSummary) => {
    await remove(chat);
    // Deleting the chat on screen leaves nothing to show: start fresh instead.
    if (chat.id === activeId) newChat();
  };

  return (
    <>
      <FloatingIconButton aria-label="Your chats" onClick={() => handleOpenChange(true)}>
        <SidebarSimpleIcon />
      </FloatingIconButton>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        {/* data-[side=left]: prefix needed to beat the sheet's own data-[side=left]:w-3/4 */}
        <SheetContent
          side="left"
          showCloseButton={false}
          className="gap-0 border-0 bg-background data-[side=left]:w-[86vw] data-[side=left]:sm:max-w-sm"
        >
          <SheetHeader className="flex-row items-center gap-3 px-4 pt-[max(1.25rem,env(safe-area-inset-top))]">
            <SheetTitle className="min-w-0 flex-1 font-display text-2xl font-semibold tracking-tight">Your chats</SheetTitle>
            <SheetDescription className="sr-only">Open or delete an earlier conversation.</SheetDescription>
            <SheetClose render={<FloatingIconButton aria-label="Close" />}>
              <XIcon />
            </SheetClose>
          </SheetHeader>

          <div className="px-3 pb-2">
            <button
              type="button"
              onClick={newChat}
              className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-[0.95rem] font-medium outline-none hover:bg-card focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <NotePencilIcon className="size-[18px]" />
              New chat
            </button>
          </div>

          <nav
            aria-label="Past chats"
            className="scrollbar-subtle min-h-0 flex-1 overflow-y-auto px-3 pb-[max(1rem,env(safe-area-inset-bottom))]"
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
              openedAt &&
              groupChatsByRecency(chats, openedAt).map((group) => (
                <section key={group.label} className="mt-4 first:mt-1">
                  <h3 className="px-3 pb-1 text-xs font-medium text-muted-foreground">{group.label}</h3>
                  <ul className="flex flex-col gap-0.5">
                    {group.chats.map((chat) => (
                      <ChatRow
                        key={chat.id}
                        chat={chat}
                        isActive={chat.id === activeId}
                        onOpen={() => setOpen(false)}
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
        </SheetContent>
      </Sheet>
    </>
  );
}

type ChatRowProps = {
  chat: ChatSummary;
  isActive: boolean;
  onOpen: () => void;
  onDelete: () => void;
};

/** A chat's title as a link; deleting asks first in place, because it can't be undone. */
function ChatRow({ chat, isActive, onOpen, onDelete }: ChatRowProps) {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      // Scrolled fully into view when it appears: it may open half hidden in a scrolled list.
      <li ref={(row) => row?.scrollIntoView({ block: "nearest" })} className="flex flex-col gap-2 rounded-xl bg-card px-3 py-3 shadow-soft">
        <p className="text-sm leading-snug">
          Delete <span className="font-medium">{chat.title}</span>? This can&apos;t be undone.
        </p>
        <div className="flex gap-2">
          <Button variant="destructive" size="sm" onClick={onDelete} autoFocus>
            Delete
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
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
          "flex h-11 items-center rounded-xl pr-10 pl-3 text-[0.95rem] outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          isActive ? "bg-card font-medium shadow-soft" : "hover:bg-card/70",
        )}
      >
        <span className="truncate">{chat.title}</span>
      </Link>
      <Button
        variant="ghost"
        size="icon-xs"
        // Visible on hover and keyboard focus; always visible on touch screens (no hover).
        className="absolute top-1/2 right-2 -translate-y-1/2 text-muted-foreground opacity-100 pointer-fine:opacity-0 pointer-fine:group-hover/chat:opacity-100 focus-visible:opacity-100"
        aria-label={`Delete chat: ${chat.title}`}
        onClick={() => setConfirming(true)}
      >
        <TrashSimpleIcon />
      </Button>
    </li>
  );
}
