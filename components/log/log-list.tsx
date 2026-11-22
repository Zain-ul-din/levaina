import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { describeEntry } from "@/lib/log/describe-entry";
import { KIND_LABELS } from "@/lib/log/labels";
import { safetyNoteFor } from "@/lib/log/safety";
import type { LogEntry } from "@/lib/log/types";
import { XIcon } from "@phosphor-icons/react";

type LogListProps = {
  entries: LogEntry[];
  onRemove: (entry: LogEntry) => void;
};

// Device zone: the sheet shows the user's own day boundaries and clock.
const dayFormat = new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long" });
const clockFormat = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" });

/** The log as a diary: one card per day, newest first. Purely presentational. */
export function LogList({ entries, onRemove }: LogListProps) {
  if (entries.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Nothing logged yet</EmptyTitle>
          <EmptyDescription>
            Log a meal or how your gut feels, or just tell the coach. After a few days it can start spotting patterns.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const days = new Map<string, LogEntry[]>();
  for (const entry of entries) {
    const day = dayFormat.format(new Date(entry.loggedAt));
    days.set(day, [...(days.get(day) ?? []), entry]);
  }

  return (
    <div className="flex flex-col gap-6">
      {[...days].map(([day, dayEntries]) => (
        <section key={day} className="flex flex-col gap-2">
          <h3 className="px-1 text-[0.95rem] font-semibold">{day}</h3>
          <ul className="flex flex-col divide-y rounded-2xl bg-card px-4 shadow-soft">
            {dayEntries.map((entry) => (
              <LogRow key={entry.id} entry={entry} onRemove={onRemove} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function LogRow({ entry, onRemove }: { entry: LogEntry; onRemove: (entry: LogEntry) => void }) {
  const text = describeEntry(entry);
  const needsDoctor = safetyNoteFor(entry) !== undefined;

  return (
    <li className="group/entry flex items-start gap-3 py-3">
      {/* Wide enough for 12-hour clocks ("06:58 PM") on one line. */}
      <span className="w-16 shrink-0 pt-px text-xs whitespace-nowrap text-muted-foreground tabular-nums">
        {clockFormat.format(new Date(entry.loggedAt))}
      </span>
      <span aria-hidden="true" className="shrink-0">
        {KIND_LABELS[entry.kind].emoji}
      </span>
      <span className="min-w-0 flex-1 text-[0.95rem] leading-relaxed">
        <span className="sr-only">{KIND_LABELS[entry.kind].label}: </span>
        {text}
        {needsDoctor && <span className="mt-0.5 block text-sm text-destructive">Worth checking with a doctor</span>}
      </span>
      <Button
        variant="ghost"
        size="icon-xs"
        // Visible on hover and keyboard focus; always visible on touch screens (no hover).
        className="shrink-0 opacity-100 pointer-fine:opacity-0 pointer-fine:group-hover/entry:opacity-100 focus-visible:opacity-100"
        aria-label={`Remove: ${text}`}
        onClick={() => onRemove(entry)}
      >
        <XIcon />
      </Button>
    </li>
  );
}
