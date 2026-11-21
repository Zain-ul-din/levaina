"use client";

import { Button } from "@/components/ui/button";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import type { MemoryToolPart } from "@/lib/chat/types";
import { forgetMemoryRequest } from "@/lib/memory/memory-api";
import {
  BookmarkSimpleIcon,
  ArrowCounterClockwiseIcon,
  PencilSimpleIcon,
  TrashSimpleIcon,
  WarningCircleIcon,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useState, type ReactNode } from "react";

type MemoryPartProps = {
  part: MemoryToolPart;
};

const LABELS = {
  "tool-saveMemory": { pending: "Saving to memory", done: "Saved", icon: <BookmarkSimpleIcon /> },
  "tool-updateMemory": { pending: "Updating memory", done: "Updated", icon: <PencilSimpleIcon /> },
  "tool-forgetMemory": { pending: "Removing from memory", done: "Forgot", icon: <TrashSimpleIcon /> },
} satisfies Record<MemoryToolPart["type"], { pending: string; done: string; icon: ReactNode }>;

/** One quiet line under the reply showing what the coach just remembered. */
export function MemoryPart({ part }: MemoryPartProps) {
  const label = LABELS[part.type];

  if (part.state === "input-streaming" || part.state === "input-available") {
    return (
      <Marker>
        <MarkerIcon>{label.icon}</MarkerIcon>
        <MarkerContent className="shimmer">{label.pending}</MarkerContent>
      </Marker>
    );
  }

  const output = part.state === "output-available" ? part.output : null;
  if (!output || "error" in output) {
    return (
      <Marker className="text-destructive">
        <MarkerIcon>
          <WarningCircleIcon />
        </MarkerIcon>
        <MarkerContent>Couldn&apos;t update memory</MarkerContent>
      </Marker>
    );
  }

  return (
    // Top-aligned so the icon and Undo stay on the first line when the text expands.
    // Icon (16px) + mt-1 and text (20px) + py-0.5 both centre on Undo's 24px height.
    <Marker className="items-start">
      <MarkerIcon className="mt-1">{label.icon}</MarkerIcon>
      <ExpandableText label={label.done} text={output.content} />
      {/* Only a fresh save can be undone in one step; updates and removals are reversible by asking. */}
      {part.type === "tool-saveMemory" && <UndoSave memoryId={output.id} />}
    </Marker>
  );
}

/**
 * One line by default ("Saved: Wants to keep carbs in his di…"); click to read it all.
 * The button wraps only the text, so Undo next to it stays a separate target.
 */
function ExpandableText({ label, text }: { label: string; text: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      type="button"
      aria-expanded={expanded}
      title={expanded ? undefined : text}
      onClick={() => setExpanded((value) => !value)}
      className={cn(
        "min-w-0 flex-1 cursor-pointer rounded-sm py-0.5 text-left outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
        expanded ? "wrap-break-word" : "truncate",
      )}
    >
      <span className="font-medium">{label}:</span> {text}
    </button>
  );
}

function UndoSave({ memoryId }: { memoryId: number }) {
  const [state, setState] = useState<"idle" | "pending" | "undone" | "failed">("idle");

  if (state === "undone") return <span className="shrink-0 text-xs">Removed</span>;

  const undo = async () => {
    setState("pending");
    try {
      await forgetMemoryRequest(memoryId);
      setState("undone");
    } catch {
      setState("failed");
    }
  };

  return (
    <Button
      variant="ghost"
      size="xs"
      className="ml-auto shrink-0"
      disabled={state === "pending"}
      onClick={undo}
    >
      <ArrowCounterClockwiseIcon />
      {state === "failed" ? "Retry undo" : "Undo"}
    </Button>
  );
}
