import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { describeEntry } from "@/lib/log/describe-entry";
import { KIND_LABELS } from "@/lib/log/labels";
import { safetyNoteFor } from "@/lib/log/safety";
import type { LogEntry } from "@/lib/log/types";
import { XIcon } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { KindBadge } from "./kind-badge";

type RemoveHandler = (entry: LogEntry) => void;

// Device zone: the sheet shows the user's own day boundaries and clock.
const dayFormat = new Intl.DateTimeFormat(undefined, { weekday: "long", day: "numeric", month: "long" });
const clockFormat = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" });

/** "Sunday 22 November" for an entry, in the device's zone; also the key for grouping by day. */
export const entryDay = (entry: Pick<LogEntry, "loggedAt">) => dayFormat.format(new Date(entry.loggedAt));

/** The whole log as a diary: one card per day, newest day first. */
export function LogList({ entries, onRemove }: { entries: LogEntry[]; onRemove: RemoveHandler }) {
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
  for (const entry of entries) days.set(entryDay(entry), [...(days.get(entryDay(entry)) ?? []), entry]);

  return (
    <div className="flex flex-col gap-6">
      {[...days].map(([day, dayEntries]) => (
        <section key={day} className="flex flex-col gap-2.5">
          <h3 className="text-[0.95rem] font-semibold">{day}</h3>
          <div className="rounded-2xl bg-card px-4 pt-4 pb-1 shadow-soft">
            <LogTimeline entries={dayEntries} onRemove={onRemove} />
          </div>
        </section>
      ))}
    </div>
  );
}

/**
 * Entries in time order, newest at the top. The line joining the icons is the sequence itself,
 * so it's only drawn between entries, never after the last one.
 */
export function LogTimeline({
  entries,
  justAddedId,
  onRemove,
}: {
  entries: LogEntry[];
  /** An entry saved a moment ago: it eases into place instead of appearing in a blink. */
  justAddedId?: number;
  onRemove: RemoveHandler;
}) {
  return (
    <ol className="flex flex-col">
      {entries.map((entry, index) => (
        <TimelineRow
          key={entry.id}
          entry={entry}
          isLast={index === entries.length - 1}
          isNew={entry.id === justAddedId}
          onRemove={onRemove}
        />
      ))}
    </ol>
  );
}

function TimelineRow({
  entry,
  isLast,
  isNew,
  onRemove,
}: {
  entry: LogEntry;
  isLast: boolean;
  isNew: boolean;
  onRemove: RemoveHandler;
}) {
  const text = describeEntry(entry);
  const needsDoctor = safetyNoteFor(entry) !== undefined;

  return (
    <li
      className={cn(
        "group/entry flex items-stretch gap-3",
        isNew &&
          "transition-[opacity,transform] duration-300 ease-(--ease-out) starting:-translate-y-1.5 starting:opacity-0 motion-reduce:starting:translate-y-0",
      )}
    >
      {/* Wide enough for 12-hour clocks ("06:58 PM") on one line; nudged to the icon's centre line. */}
      <span className="w-16 shrink-0 pt-2 text-xs whitespace-nowrap text-muted-foreground tabular-nums">
        {clockFormat.format(new Date(entry.loggedAt))}
      </span>

      <span className="flex shrink-0 flex-col items-center">
        <KindBadge kind={entry.kind} />
        {!isLast && <span aria-hidden="true" className="my-1 w-px flex-1 bg-border" />}
      </span>

      <span className="min-w-0 flex-1 pt-1 pb-4 text-[0.95rem] leading-relaxed">
        <span className="sr-only">{KIND_LABELS[entry.kind]}: </span>
        {text}
        {needsDoctor && <span className="mt-0.5 block text-sm text-destructive">Worth checking with a doctor</span>}
      </span>

      <Button
        variant="ghost"
        size="icon-xs"
        // Visible on hover and keyboard focus; always visible on touch screens (no hover).
        className="mt-1 shrink-0 opacity-100 pointer-fine:opacity-0 pointer-fine:group-hover/entry:opacity-100 focus-visible:opacity-100"
        aria-label={`Remove: ${text}`}
        onClick={() => onRemove(entry)}
      >
        <XIcon />
      </Button>
    </li>
  );
}
