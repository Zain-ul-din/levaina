"use client";

import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import type { MemoryToolPart } from "@/lib/chat/types";
import { forgetMemoryRequest } from "@/lib/memory/memory-api";
import { BookmarkSimpleIcon, PencilSimpleIcon, TrashSimpleIcon, WarningCircleIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { ExpandableToolText, UndoButton } from "./tool-line";

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
    // Top-aligned so Undo stays on the first line when the text expands (text py-0.5 centres on Undo's 24px).
    // The "Saved" pill already says what happened; an icon next to it would say it twice.
    <Marker className="items-start">
      <ExpandableToolText label={label.done} text={output.content} />
      {/* Only a fresh save can be undone in one step; updates and removals are reversible by asking. */}
      {part.type === "tool-saveMemory" && <UndoButton undo={() => forgetMemoryRequest(output.id)} />}
    </Marker>
  );
}
