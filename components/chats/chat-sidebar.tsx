"use client";

import { TraceLine, TraceTitle } from "@/components/ui/trace";
import { Suspense, useEffect } from "react";
import { useChatHistory } from "./chat-history-context";
import { ChatHistoryList } from "./chat-history-list";
import { isDesktop, useSidebarCollapsed } from "./sidebar-state";

/**
 * The chat list docked at the left on a desktop, part of the layout like ChatGPT and Claude.
 * Hidden below the desktop breakpoint by CSS (the header button opens a drawer there instead),
 * so the server renders the same page for every screen and nothing jumps after loading.
 */
export function ChatSidebar() {
  const collapsed = useSidebarCollapsed();
  const { history } = useChatHistory();
  const { load } = history;

  // Load when it becomes visible; skipped on phones, where this sidebar is hidden.
  useEffect(() => {
    if (!collapsed && isDesktop()) void load();
  }, [collapsed, load]);

  if (collapsed) return null;

  return (
    <aside
      aria-label="Your chats"
      className="hidden h-dvh w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar pt-[env(safe-area-inset-top)] lg:flex"
    >
      {/* Same height as the chat header, so both top edges line up. */}
      <div className="flex h-16 shrink-0 items-center px-6">
        <h2 className="font-display text-xl font-semibold tracking-tight">Your chats</h2>
      </div>
      {/* The list reads the URL (to highlight the open chat), which Next only allows inside Suspense;
          the rest of the layout is pre-rendered. The fallback matches the list's own first state. */}
      <Suspense
        fallback={
          <div className="px-6 py-2">
            <TraceLine status="running">
              <TraceTitle>Loading</TraceTitle>
            </TraceLine>
          </div>
        }
      >
        <ChatHistoryList history={history} />
      </Suspense>
    </aside>
  );
}
