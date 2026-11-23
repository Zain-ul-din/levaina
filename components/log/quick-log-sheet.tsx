"use client";

import { FloatingIconButton } from "@/components/brand/floating-icon-button";
import { UndoButton } from "@/components/chat/primitives/tool-line";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { TraceLine, TraceTitle } from "@/components/ui/trace";
import { KIND_LABELS, QUICK_LOG_KINDS } from "@/lib/log/labels";
import { addLogEntryRequest, removeLogEntryRequest, type AddLogEntryInput, type AddLogEntryResponse } from "@/lib/log/log-api";
import { ArrowLeftIcon, CaretRightIcon, XIcon } from "@phosphor-icons/react";
import { useEffect, useState, type ComponentType } from "react";
import type { LogFormProps } from "./forms/form-props";
import { MealForm } from "./forms/meal-form";
import { StoolForm } from "./forms/stool-form";
import { SymptomForm } from "./forms/symptom-form";
import { WeightForm } from "./forms/weight-form";
import { KindBadge } from "./kind-badge";
import { entryDay, LogList, LogTimeline } from "./log-list";
import { SafetyNote } from "./safety-note";
import { useLog } from "./use-log";

type QuickLogKind = (typeof QUICK_LOG_KINDS)[number];

/** Adding a kind to the sheet = a label in lib/log/labels.ts, an icon in kind-badge.tsx, and a form here. */
const FORMS: Record<QuickLogKind, ComponentType<LogFormProps>> = {
  meal: MealForm,
  symptom: SymptomForm,
  stool: StoolForm,
  weight: WeightForm,
};

/** What the sheet shows: home (actions + today), one kind's form, or every entry. */
type View = "home" | QuickLogKind | "history";

type QuickLogSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const clock = (iso: string) => new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

/**
 * The log's home, opened from the chat's + button.
 * Logging is two taps: pick what, fill a few chips, save. Saving returns home, where the entry
 * joins today's timeline with Undo, so several things can be logged in a row.
 * Entries go to the same log the coach reads; the chat isn't interrupted.
 */
export function QuickLogSheet({ open, onOpenChange }: QuickLogSheetProps) {
  const [view, setView] = useState<View>("home");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<AddLogEntryResponse | null>(null);
  const log = useLog();
  const { load } = log;

  // Fresh every time the sheet opens: the coach may have logged something from the chat since.
  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const show = (next: View) => {
    setView(next);
    setError(null);
  };

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    // Start fresh next time; a confirmation from an earlier visit would be confusing.
    if (!next) {
      show("home");
      setLastSaved(null);
    }
  };

  const save = async (input: AddLogEntryInput) => {
    setIsSaving(true);
    setError(null);
    try {
      const saved = await addLogEntryRequest(input);
      setLastSaved(saved);
      log.prepend(saved.entry);
      setView("home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save that. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const undoLastSaved = async (saved: AddLogEntryResponse) => {
    await removeLogEntryRequest(saved.entry.id);
    log.drop(saved.entry.id);
    setLastSaved(null);
  };

  const isForm = view !== "home" && view !== "history";
  const Form = isForm ? FORMS[view] : null;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        // At least ~2/3 of the screen, so it reads as a place (not a popup hugging two rows),
        // and doesn't jump in height when moving between home, a form and the full log.
        className="mx-auto max-h-[92dvh] min-h-[66dvh] w-full max-w-lg gap-0 rounded-t-[1.75rem] border-0 bg-background"
      >
        <SheetHeader className="flex-row items-center gap-3 px-5 pt-5">
          {view !== "home" && (
            <FloatingIconButton aria-label="Back" onClick={() => show("home")}>
              <ArrowLeftIcon />
            </FloatingIconButton>
          )}
          {isForm && <KindBadge kind={view} />}
          <div className="min-w-0 flex-1">
            <SheetTitle className="font-display text-2xl font-semibold tracking-tight">
              {view === "home" ? "Log something" : view === "history" ? "Your log" : KIND_LABELS[view]}
            </SheetTitle>
            <SheetDescription className={view === "home" ? undefined : "sr-only"}>
              The coach sees everything you log and looks for patterns.
            </SheetDescription>
          </div>
          <SheetClose render={<FloatingIconButton aria-label="Close" />}>
            <XIcon />
          </SheetClose>
        </SheetHeader>

        <div className="scrollbar-subtle min-h-0 flex-1 overflow-y-auto px-5 pt-4 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {Form && (
            // key: a fresh form (and a fresh "now") every time an action is opened.
            <Form key={view} onSubmit={save} isSaving={isSaving} error={error} />
          )}

          {view === "history" && <History log={log} />}

          {view === "home" && (
            <div className="flex flex-col gap-6">
              <ActionRow onChoose={show} />
              {lastSaved && (
                // key: a fresh confirmation (and a fresh check drawing) for every save.
                <SavedConfirmation key={lastSaved.entry.id} saved={lastSaved} onUndo={() => undoLastSaved(lastSaved)} />
              )}
              <Today log={log} justAddedId={lastSaved?.entry.id} onShowAll={() => show("history")} />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** The four things people log most, as one row of round buttons: the sheet's main job. */
function ActionRow({ onChoose }: { onChoose: (kind: QuickLogKind) => void }) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {QUICK_LOG_KINDS.map((kind) => (
        <button
          key={kind}
          type="button"
          onClick={() => onChoose(kind)}
          className="group/action flex flex-col items-center gap-2 rounded-2xl py-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <KindBadge
            kind={kind}
            size="lg"
            className="shadow-soft transition-transform group-hover/action:-translate-y-0.5 group-active/action:scale-95"
          />
          <span className="text-sm font-medium">{KIND_LABELS[kind]}</span>
        </button>
      ))}
    </div>
  );
}

/** Today's entries as a timeline, so what's already logged is visible without another screen. */
function Today({
  log,
  justAddedId,
  onShowAll,
}: {
  log: ReturnType<typeof useLog>;
  justAddedId?: number;
  onShowAll: () => void;
}) {
  // The day the sheet was opened; fixed so the list doesn't shift at midnight mid-view.
  const [today] = useState(() => entryDay({ loggedAt: new Date().toISOString() }));
  const todays = log.entries.filter((entry) => entryDay(entry) === today);
  const hasEarlier = log.hasMore || log.entries.length > todays.length;

  return (
    <section aria-labelledby="log-today" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3 px-1">
        <h3 id="log-today" className="text-[0.95rem] font-semibold">
          Today
        </h3>
        {(todays.length > 0 || hasEarlier) && (
          <button
            type="button"
            onClick={onShowAll}
            className="flex items-center gap-1 rounded-md text-sm text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            All entries
            <CaretRightIcon className="size-3.5" />
          </button>
        )}
      </div>

      {log.error && (
        <p role="alert" className="px-1 text-sm text-destructive">
          {log.error}
        </p>
      )}

      {log.status === "ready" && todays.length > 0 && (
        <div className="rounded-2xl bg-card px-4 pt-4 pb-1 shadow-soft">
          <LogTimeline entries={todays} justAddedId={justAddedId} onRemove={log.remove} />
        </div>
      )}
      {log.status === "ready" && todays.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border px-4 py-5 text-center text-[0.95rem] text-muted-foreground">
          Nothing logged today yet. Tap above, or just tell the coach what you ate.
        </p>
      )}
      {(log.status === "loading" || log.status === "idle") && (
        <TraceLine status="running">
          <TraceTitle>Loading</TraceTitle>
        </TraceLine>
      )}
    </section>
  );
}

function History({ log }: { log: ReturnType<typeof useLog> }) {
  return (
    <div className="flex flex-col gap-4">
      {log.error && (
        <p role="alert" className="text-sm text-destructive">
          {log.error}
        </p>
      )}
      {log.status === "loading" || log.status === "idle" ? (
        <TraceLine status="running">
          <TraceTitle>Loading</TraceTitle>
        </TraceLine>
      ) : (
        log.status === "ready" && <LogList entries={log.entries} onRemove={log.remove} />
      )}
      {log.status === "ready" && log.hasMore && (
        <Button variant="ghost" className="h-10 rounded-xl text-muted-foreground" disabled={log.isLoadingMore} onClick={log.loadMore}>
          {log.isLoadingMore ? "Loading…" : "Show earlier"}
        </Button>
      )}
    </div>
  );
}

function SavedConfirmation({ saved, onUndo }: { saved: AddLogEntryResponse; onUndo: () => Promise<void> }) {
  return (
    <div className="flex flex-col gap-3">
      <div
        role="status"
        className="flex items-center gap-2 rounded-2xl bg-(--saved) px-4 py-3 text-(--saved-foreground) transition-[opacity,transform] duration-300 ease-(--ease-out) starting:-translate-y-1 starting:opacity-0 motion-reduce:starting:translate-y-0"
      >
        <DrawnCheck />
        <span className="min-w-0 flex-1 truncate text-[0.95rem]">
          <span className="font-medium">Logged {clock(saved.entry.loggedAt)}</span> · {saved.text}
        </span>
        <UndoButton undo={onUndo} />
      </div>
      {saved.safetyNote && <SafetyNote>{saved.safetyNote}</SafetyNote>}
    </div>
  );
}

/** A filled circle whose check mark draws itself (feedback that the save landed). */
function DrawnCheck() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="size-5 shrink-0">
      <circle cx="10" cy="10" r="10" fill="currentColor" />
      <path
        d="M6 10.4l2.7 2.7L14.2 7.4"
        pathLength={1}
        fill="none"
        stroke="var(--saved)"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="draw-check"
      />
    </svg>
  );
}
