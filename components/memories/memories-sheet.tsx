"use client";

import { InputGroupButton } from "@/components/ui/input-group";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { TraceLine, TraceTitle } from "@/components/ui/trace";
import { BookmarksSimpleIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { MemoryList } from "./memory-list";
import { useMemories } from "./use-memories";

/** Composer button that opens everything the coach remembers about you. */
export function MemoriesSheet() {
  const [open, setOpen] = useState(false);
  const { memories, status, error, load, forget } = useMemories();

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) void load();
  };

  return (
    <>
      <InputGroupButton
        size="icon-sm"
        variant="outline"
        className="rounded-full"
        aria-label="What the coach remembers"
        onClick={() => handleOpenChange(true)}
      >
        <BookmarksSimpleIcon />
      </InputGroupButton>

      <Sheet open={open} onOpenChange={handleOpenChange}>
        {/* data-[side=right]: prefix needed to beat the sheet's own data-[side=right]:w-3/4 */}
        <SheetContent className="gap-0 data-[side=right]:w-full data-[side=right]:sm:max-w-md">
          <SheetHeader className="border-b">
            <SheetTitle>What I remember</SheetTitle>
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
