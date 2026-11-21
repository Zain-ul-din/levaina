"use client";

import { FloatingIconButton } from "@/components/brand/floating-icon-button";
import { MemoriesSheet } from "@/components/memories/memories-sheet";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { NotePencilIcon } from "@phosphor-icons/react";
import { useChatActions } from "./chat-provider";

/** Top bar: serif wordmark on the left; theme, memories and new chat as floating round buttons. */
export function ChatHeader() {
  const { hasMessages, startNewChat } = useChatActions();

  return (
    // Top padding = the safe-area inset, so the bar sits below the notch / status bar in the app.
    <header className="shrink-0 pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex h-16 w-full max-w-3xl items-center gap-3 px-[max(1.25rem,env(safe-area-inset-left))]">
        <span className="font-display text-xl font-semibold tracking-tight">Gut Coach</span>

        <div className="ml-auto flex items-center gap-2.5">
          <ThemeToggle />
          <MemoriesSheet />
          <FloatingIconButton aria-label="New chat" disabled={!hasMessages} onClick={startNewChat}>
            <NotePencilIcon />
          </FloatingIconButton>
        </div>
      </div>
    </header>
  );
}
