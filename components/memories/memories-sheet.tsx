"use client";

import { SheetTitleBar } from "@/components/brand/sheet-title-bar";
import { FloatingIconButton } from "@/components/brand/floating-icon-button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { TraceLine, TraceTitle } from "@/components/ui/trace";
import { BookmarksSimpleIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { MemoryList } from "./memory-list";
import { useMemories } from "./use-memories";

/** Header button that opens everything the coach remembers about you. */
export function MemoriesSheet() {
  const [open, setOpen] = useState(false);
  const { memories, status, error, load, forget } = useMemories();

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) void load();
  };

  return (
    <>
      <FloatingIconButton
        aria-label="What the coach remembers"
        onClick={() => handleOpenChange(true)}
      >
        <BookmarksSimpleIcon />
      </FloatingIconButton>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        {/* data-[side=right]: prefix needed to beat the sheet's own data-[side=right]:w-3/4 */}
        <SheetContent
          showCloseButton={false}
          className="gap-0 bg-background data-[side=right]:w-full data-[side=right]:sm:max-w-md"
        >
          <SheetTitleBar
            title="What I remember"
            description="Saved from your chats and used in every conversation. Remove anything that's wrong."
          />

          <div className="scrollbar-subtle min-h-0 flex-1 overflow-y-auto px-5 py-4">
            {error && (
              <p role="alert" className="mb-4 text-sm text-destructive">
                {error}
              </p>
            )}
            {status === "loading" || status === "idle" ? (
              <TraceLine status="running">
                <TraceTitle>Loading</TraceTitle>
              </TraceLine>
            ) : (
              status === "ready" && (
                <MemoryList memories={memories} onForget={forget} />
              )
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
