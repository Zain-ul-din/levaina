"use client";

import { FloatingIconButton } from "@/components/brand/floating-icon-button";
import { UndoButton } from "@/components/chat/primitives/tool-line";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { TraceLine, TraceTitle } from "@/components/ui/trace";
import { Button } from "@/components/ui/button";
import { KIND_LABELS, QUICK_LOG_KINDS } from "@/lib/log/labels";
import { addLogEntryRequest, removeLogEntryRequest, type AddLogEntryInput, type AddLogEntryResponse } from "@/lib/log/log-api";
import { ArrowLeftIcon, CaretRightIcon, CheckCircleIcon, XIcon } from "@phosphor-icons/react";
import { useState, type ComponentType } from "react";
import type { LogFormProps } from "./forms/form-props";
import { MealForm } from "./forms/meal-form";
import { StoolForm } from "./forms/stool-form";
import { SymptomForm } from "./forms/symptom-form";
import { WeightForm } from "./forms/weight-form";
import { LogList } from "./log-list";
import { SafetyNote } from "./safety-note";
import { useLog } from "./use-log";

type QuickLogKind = (typeof QUICK_LOG_KINDS)[number];

/** Adding a kind to the sheet = a label in lib/log/labels.ts and a form here. */
const FORMS: Record<QuickLogKind, ComponentType<LogFormProps>> = {
  meal: MealForm,
  symptom: SymptomForm,
  stool: StoolForm,
  weight: WeightForm,
};

/** What the sheet shows: the tiles, one kind's form, or the log itself. */
type View = "home" | QuickLogKind | "history";

type QuickLogSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const clock = (iso: string) => new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

const TITLES: Record<View, string> = {
  home: "Log something",
  history: "Your log",
  ...(Object.fromEntries(QUICK_LOG_KINDS.map((kind) => [kind, `${KIND_LABELS[kind].emoji} ${KIND_LABELS[kind].label}`])) as Record<
    QuickLogKind,
    string
  >),
};

/**
 * The log's home, opened from the chat's + button.
 * Logging is two taps: pick what, fill a few chips, save. Saving returns here with a confirmation
 * and Undo, so several things can be logged in a row. "Your log" lists everything, by day.
 * Entries go to the same log the coach reads; the chat isn't interrupted.
 */
export function QuickLogSheet({ open, onOpenChange }: QuickLogSheetProps) {
  const [view, setView] = useState<View>("home");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<AddLogEntryResponse | null>(null);
  const log = useLog();

  const show = (next: View) => {
    setView(next);
    setError(null);
    if (next === "history") void log.load();
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
      setLastSaved(await addLogEntryRequest(input));
      setView("home");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save that. Try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const Form = view !== "home" && view !== "history" ? FORMS[view] : null;

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className="mx-auto max-h-[92dvh] w-full max-w-lg gap-0 rounded-t-[1.75rem] border-0 bg-background"
      >
        <SheetHeader className="flex-row items-center gap-3 px-5 pt-5">
          {view !== "home" && (
            <FloatingIconButton aria-label="Back" onClick={() => show("home")}>
              <ArrowLeftIcon />
            </FloatingIconButton>
          )}
          <div className="min-w-0 flex-1">
            <SheetTitle className="font-display text-2xl font-semibold tracking-tight">{TITLES[view]}</SheetTitle>
            <SheetDescription className={view === "home" ? undefined : "sr-only"}>
              The coach sees everything you log and looks for patterns.
            </SheetDescription>
          </div>
          <SheetClose render={<FloatingIconButton aria-label="Close" />}>
            <XIcon />
          </SheetClose>
        </SheetHeader>

        <div className="scrollbar-subtle min-h-0 flex-1 overflow-y-auto px-5 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {Form && (
            // key: a fresh form (and a fresh "now") every time a tile is opened.
            <Form key={view} onSubmit={save} isSaving={isSaving} error={error} />
          )}

          {view === "history" && <History log={log} />}

          {view === "home" && (
            <div className="flex flex-col gap-4">
              {lastSaved && <SavedConfirmation saved={lastSaved} onUndone={() => setLastSaved(null)} />}
              <KindTiles onChoose={show} />
              <button
                type="button"
                onClick={() => show("history")}
                className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3.5 text-left shadow-soft outline-none hover:bg-card/80 focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <span aria-hidden="true" className="text-xl">
                  📖
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-semibold">Your log</span>
                  <span className="block text-sm text-muted-foreground">See or remove what you and the coach logged</span>
                </span>
                <CaretRightIcon className="size-4 text-muted-foreground" />
              </button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function KindTiles({ onChoose }: { onChoose: (kind: QuickLogKind) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {QUICK_LOG_KINDS.map((kind) => (
        <button
          key={kind}
          type="button"
          onClick={() => onChoose(kind)}
          className="flex flex-col items-start gap-1 rounded-2xl bg-card p-4 text-left shadow-soft transition-transform outline-none hover:bg-card/80 focus-visible:ring-3 focus-visible:ring-ring/50 active:scale-[0.98]"
        >
          <span aria-hidden="true" className="text-2xl">
            {KIND_LABELS[kind].emoji}
          </span>
          <span className="text-base font-semibold">{KIND_LABELS[kind].label}</span>
          <span className="text-sm text-muted-foreground">{KIND_LABELS[kind].hint}</span>
        </button>
      ))}
    </div>
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

function SavedConfirmation({ saved, onUndone }: { saved: AddLogEntryResponse; onUndone: () => void }) {
  return (
    <div className="flex flex-col gap-3">
      <div role="status" className="flex items-center gap-2 rounded-2xl bg-(--saved) px-4 py-3 text-(--saved-foreground)">
        <CheckCircleIcon weight="fill" className="size-5 shrink-0" />
        <span className="min-w-0 flex-1 truncate text-[0.95rem]">
          <span className="font-medium">Logged {clock(saved.entry.loggedAt)}</span> · {saved.text}
        </span>
        <UndoButton
          undo={async () => {
            await removeLogEntryRequest(saved.entry.id);
            onUndone();
          }}
        />
      </div>
      {saved.safetyNote && <SafetyNote>{saved.safetyNote}</SafetyNote>}
    </div>
  );
}
