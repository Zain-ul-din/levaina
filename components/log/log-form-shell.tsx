"use client";

import { Button } from "@/components/ui/button";
import { localInputToIso, toLocalInputValue } from "@/lib/log/device-time";
import type { AddLogEntryInput } from "@/lib/log/log-api";
import { safetyNoteFor } from "@/lib/log/safety";
import type { LogContent } from "@/lib/log/types";
import { useState, type ReactNode, type SubmitEvent } from "react";
import { SafetyNote } from "./safety-note";

type LogFormShellProps = {
  /** The entry as filled in so far; null while something required is missing. */
  content: LogContent | null;
  onSubmit: (input: AddLogEntryInput) => void;
  isSaving: boolean;
  error: string | null;
  children: ReactNode;
};

/**
 * What every quick-log form shares: its fields, a live safety note, "When" (defaults to now),
 * and Save. Each kind's form only decides its own fields and when it's complete.
 */
export function LogFormShell({ content, onSubmit, isSaving, error, children }: LogFormShellProps) {
  // Set once when the form opens: "now" means the moment they started logging.
  const [opened] = useState(() => new Date());
  const [when, setWhen] = useState(() => toLocalInputValue(opened));
  const loggedAt = localInputToIso(when);
  const safetyNote = content ? safetyNoteFor(content) : undefined;

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (content && loggedAt && !isSaving) onSubmit({ ...content, loggedAt });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {children}

      {/* Shown the moment a warning colour or severe pain is picked, before saving. */}
      {safetyNote && <SafetyNote>{safetyNote}</SafetyNote>}

      <label className="flex flex-col gap-2.5">
        <span className="text-sm font-semibold">When</span>
        <input
          type="datetime-local"
          value={when}
          max={toLocalInputValue(opened)}
          onChange={(event) => setWhen(event.target.value)}
          className="h-11 rounded-xl border border-border bg-card px-3.5 text-[0.95rem] outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </label>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <Button type="submit" disabled={!content || !loggedAt || isSaving} className="h-12 rounded-full text-base">
        {isSaving ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
