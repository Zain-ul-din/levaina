"use client";

import { SheetTitleBar } from "@/components/brand/sheet-title-bar";
import { FloatingIconButton } from "@/components/brand/floating-icon-button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { SidebarSimpleIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { ChatHistoryList } from "./chat-history-list";
import {
  isDesktop,
  setSidebarCollapsed,
  useSidebarCollapsed,
} from "./sidebar-state";
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
          onDismiss={() => handleOpenChange(false)}
          className="gap-0 bg-background data-[side=left]:w-[86vw] data-[side=left]:sm:max-w-sm"
        >
          <SheetTitleBar
            title="Your chats"
            description="Open or delete an earlier conversation."
            hideDescription
          />
          <ChatHistoryList history={history} onDone={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
