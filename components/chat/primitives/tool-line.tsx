"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowCounterClockwiseIcon } from "@phosphor-icons/react";
import { useState } from "react";

/*
 * Shared pieces of the quiet one-line chips the coach's tools leave in the Brain
 * ("Saved: …", "Logged: …"), so memory and log chips look and behave the same.
 */

/**
 * One line by default ("Saved: Wants to keep carbs in his di…"); click to read it all.
 * The button wraps only the text, so an Undo next to it stays a separate target.
 */
export function ExpandableToolText({ label, text }: { label: string; text: string }) {
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
      <span className="mr-2 inline-block rounded-full bg-(--saved) px-2 py-0.5 text-xs font-medium text-(--saved-foreground)">
        {label}
      </span>
      {text}
    </button>
  );
}

/** Undo for something a tool just did; `undo` throws on failure so the user can retry. */
export function UndoButton({ undo, doneLabel = "Removed" }: { undo: () => Promise<void>; doneLabel?: string }) {
  const [state, setState] = useState<"idle" | "pending" | "undone" | "failed">("idle");

  if (state === "undone") return <span className="shrink-0 text-xs">{doneLabel}</span>;

  const run = async () => {
    setState("pending");
    try {
      await undo();
      setState("undone");
    } catch {
      setState("failed");
    }
  };

  return (
    <Button variant="ghost" size="xs" className="ml-auto shrink-0" disabled={state === "pending"} onClick={run}>
      <ArrowCounterClockwiseIcon />
      {state === "failed" ? "Retry undo" : "Undo"}
    </Button>
  );
}
