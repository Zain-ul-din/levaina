"use client";

import { FloatingIconButton } from "@/components/brand/floating-icon-button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { TraceLine, TraceTitle } from "@/components/ui/trace";
import { BookmarksSimpleIcon, XIcon } from "@phosphor-icons/react";
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
      <FloatingIconButton aria-label="What the coach remembers" onClick={() => handleOpenChange(true)}>
        <BookmarksSimpleIcon />
      </FloatingIconButton>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        {/* data-[side=right]: prefix needed to beat the sheet's own data-[side=right]:w-3/4 */}
        <SheetContent
          showCloseButton={false}
          className="gap-0 bg-background data-[side=right]:w-full data-[side=right]:sm:max-w-md"
        >
          <SheetHeader className="pt-[max(1.25rem,env(safe-area-inset-top))]">
            {/* Same floating round button as the header, instead of the sheet's tiny default ✕. */}
            <SheetClose render={<FloatingIconButton aria-label="Close" className="mb-3 self-end" />}>
              <XIcon />
            </SheetClose>
            <SheetTitle className="font-display text-2xl font-semibold tracking-tight">What I remember</SheetTitle>
            <SheetDescription>
              Saved from your chats and used in every conversation. Remove anything that&apos;s wrong.
            </SheetDescription>
          </SheetHeader>

          <div className="scrollbar-subtle min-h-0 flex-1 overflow-y-auto p-4">
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
              status === "ready" && <MemoryList memories={memories} onForget={forget} />
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
