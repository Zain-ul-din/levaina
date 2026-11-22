"use client";

import type { CompactionData } from "@/lib/chat/types";
import { cn } from "@/lib/utils";
import { CaretDownIcon } from "@phosphor-icons/react";
import { useState } from "react";
import { Streamdown } from "streamdown";

/**
 * ——— Compacting conversation ——— while older messages are summarized, then
 * ——— Conversation compacted ⌄ ———, which opens the summary the coach now works from.
 */
export function CompactionDivider({ data }: { data: CompactionData }) {
  const [open, setOpen] = useState(false);
  if (data.state === "failed") return null;

  const label = data.state === "running" ? "Compacting conversation" : "Conversation compacted";

  return (
    <div className="my-2">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span className="h-px flex-1 bg-border" aria-hidden />
        {data.state === "running" ? (
          <span className="shimmer motion-reduce:shimmer-none" role="status">
            {label}
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            className="flex cursor-pointer items-center gap-1 transition-colors hover:text-foreground"
          >
            {label}
            <CaretDownIcon className={cn("size-3.5 transition-transform", open && "rotate-180")} />
          </button>
        )}
        <span className="h-px flex-1 bg-border" aria-hidden />
      </div>

      {data.state === "done" && open && (
        <div className="mt-3 rounded-xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
          <p className="mb-1.5 text-foreground">
            {data.foldedMessages} earlier messages, summarized. The coach works from this now.
          </p>
          <Streamdown className="text-sm leading-relaxed">{data.summary}</Streamdown>
        </div>
      )}
    </div>
  );
}
