"use client";

import { AccountMenu } from "@/components/auth/account-menu";
import { ChatHistorySheet } from "@/components/chats/chat-history-sheet";
import { LogoMark } from "@/components/brand/logo-mark";
import { APP_NAME } from "@/lib/brand/brand";
import { MemoriesSheet } from "@/components/memories/memories-sheet";
import { ThemeToggle } from "@/components/theme/theme-toggle";

/**
 * Top bar: past chats at the far left (where ChatGPT and Claude keep it), then logo and serif wordmark;
 * theme, memories and your account as floating round buttons on the right. New chat lives in the
 * chat list (sidebar on desktop, drawer on phones).
 */
export function ChatHeader() {
  return (
    // Top padding = the safe-area inset, so the bar sits below the notch / status bar in the app.
    // view-transition-name: the header is the same on every chat, so it holds still while the page crossfades.
    <header className="shrink-0 pt-[env(safe-area-inset-top)] [view-transition-name:chat-header]">
      <div className="mx-auto flex h-16 w-full max-w-3xl items-center gap-3 px-[max(1.25rem,env(safe-area-inset-left))]">
        <ChatHistorySheet />
        <span className="flex items-center gap-2">
          <LogoMark className="size-7 text-primary" />
          <span className="font-display text-xl font-semibold tracking-tight">{APP_NAME}</span>
        </span>

        <div className="ml-auto flex items-center gap-2.5">
          <ThemeToggle />
          <MemoriesSheet />
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
