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
    <Marker>
      <MarkerIcon>{label.icon}</MarkerIcon>
      <MarkerContent>
        {label.done}: {output.content}
      </MarkerContent>
      {/* Only a fresh save can be undone in one step; updates and removals are reversible by asking. */}
      {part.type === "tool-saveMemory" && <UndoSave memoryId={output.id} />}
    </Marker>
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
