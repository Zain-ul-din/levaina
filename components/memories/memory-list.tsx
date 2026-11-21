import { Button } from "@/components/ui/button";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { CATEGORY_LABELS } from "@/lib/memory/category-labels";
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
    <div className="flex flex-col gap-6">
      {factGroups.map(({ category, items }) => (
        <MemorySection key={category} title={CATEGORY_LABELS[category]}>
          {items.map((memory) => (
            <MemoryRow key={memory.id} memory={memory} onForget={onForget} />
          ))}
        </MemorySection>
      ))}

      {episodes.length > 0 && (
        <MemorySection title="Recent days">
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

function MemorySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-1">
      <h3 className="text-xs font-medium text-muted-foreground">{title}</h3>
      <ul className="flex flex-col">{children}</ul>
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
    <li className="group/memory -mx-2 flex items-start gap-3 rounded-lg px-2 py-1.5 hover:bg-muted">
      {date && <span className="w-12 shrink-0 pt-px text-xs text-muted-foreground tabular-nums">{date}</span>}
      <span className="min-w-0 flex-1 leading-relaxed">{memory.content}</span>
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
