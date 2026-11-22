"use client";

import { FloatingIconButton } from "@/components/brand/floating-icon-button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { SidebarSimpleIcon, XIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { ChatHistoryList } from "./chat-history-list";
import { isDesktop, setSidebarCollapsed, useSidebarCollapsed } from "./sidebar-state";
import { useChatHistory } from "./chat-history-context";

/**
 * The header's "Your chats" button. On a desktop it shows or hides the docked sidebar
 * (ChatSidebar); on a phone or tablet it opens the same list as a drawer over the page.
 */
export function ChatHistorySheet() {
  const [open, setOpen] = useState(false);
  const { history } = useChatHistory();
  const collapsed = useSidebarCollapsed();

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) void history.load();
  };

  // Decided at click time, not render time, so the page renders the same on every screen size.
  const handleClick = () => {
    if (isDesktop()) setSidebarCollapsed(!collapsed);
    else handleOpenChange(true);
  };

  return (
    <>
      <FloatingIconButton aria-label="Your chats" onClick={handleClick}>
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
          <ChatHistoryList history={history} onDone={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
