import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { CATEGORY_EMOJI, CATEGORY_LABELS } from "@/lib/memory/category-labels";
import { MEMORY_CATEGORIES, type Memory } from "@/lib/memory/types";
import { XIcon } from "@phosphor-icons/react";

type MemoryListProps = {
  memories: Memory[];
  onForget: (memory: Memory) => void;
};

const episodeDate = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" });

/** Facts grouped by category, then recent episodes by date. Purely presentational. */
export function MemoryList({ memories, onForget }: MemoryListProps) {
  const facts = memories.filter((memory) => memory.kind === "fact");
  const episodes = memories.filter((memory) => memory.kind === "episode");

  if (memories.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Nothing saved yet</EmptyTitle>
          <EmptyDescription>
            Tell the coach about your symptoms, diagnosis or goals. What matters shows up here.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  const factGroups = MEMORY_CATEGORIES.map((category) => ({
    category,
    items: facts.filter((memory) => memory.category === category),
  })).filter((group) => group.items.length > 0);

  return (
    <div className="flex flex-col gap-7">
      {factGroups.map(({ category, items }) => (
        <MemorySection key={category} emoji={CATEGORY_EMOJI[category]} title={CATEGORY_LABELS[category]}>
          {items.map((memory) => (
            <MemoryRow key={memory.id} memory={memory} onForget={onForget} />
          ))}
        </MemorySection>
      ))}

      {episodes.length > 0 && (
        <MemorySection emoji="📅" title="Recent days">
          {episodes.map((memory) => (
            <MemoryRow
              key={memory.id}
              memory={memory}
              onForget={onForget}
              date={memory.occurredOn ? episodeDate.format(new Date(memory.occurredOn)) : undefined}
            />
          ))}
        </MemorySection>
      )}
    </div>
  );
}

type MemorySectionProps = { emoji: string; title: string; children: React.ReactNode };

/** A titled group of memories, held in one soft card with dividers between rows. */
function MemorySection({ emoji, title, children }: MemorySectionProps) {
  return (
    <section className="flex flex-col gap-2">
      <h3 className="flex items-center gap-2 px-1 text-[0.95rem] font-semibold">
        <span aria-hidden="true">{emoji}</span>
        {title}
      </h3>
      <ul className="flex flex-col divide-y rounded-2xl bg-card px-4 shadow-soft">{children}</ul>
    </section>
  );
}

type MemoryRowProps = {
  memory: Memory;
  onForget: (memory: Memory) => void;
  date?: string;
};

function MemoryRow({ memory, onForget, date }: MemoryRowProps) {
  return (
    <li className="group/memory flex items-start gap-3 py-3">
      {date && <span className="w-12 shrink-0 pt-px text-xs text-muted-foreground tabular-nums">{date}</span>}
      <span className="min-w-0 flex-1 text-[0.95rem] leading-relaxed">{memory.content}</span>
      <Button
        variant="ghost"
        size="icon-xs"
        // Visible on hover and keyboard focus; always visible on touch screens (no hover).
        className="shrink-0 opacity-100 pointer-fine:opacity-0 pointer-fine:group-hover/memory:opacity-100 focus-visible:opacity-100"
        aria-label={`Forget: ${memory.content}`}
        onClick={() => onForget(memory)}
      >
        <XIcon />
      </Button>
    </li>
  );
}
