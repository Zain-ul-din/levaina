import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from "@/components/ui/trace";
import type { UsedMemory } from "@/lib/chat/types";
import { BookmarksSimpleIcon } from "@phosphor-icons/react";

type UsedMemoriesPartProps = {
  memories: UsedMemory[];
};

const episodeDate = new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" });

/** Collapsed: "Using 6 memories". Expanded: exactly what the coach was told about you. */
export function UsedMemoriesPart({ memories }: UsedMemoriesPartProps) {
  const facts = memories.filter((memory) => memory.kind === "fact");
  const episodes = memories.filter((memory) => memory.kind === "episode");

  return (
    <Trace>
      <TraceCollapsible>
        <TraceCollapsibleTrigger>
          <TraceLine>
            <TraceIcon>
              <BookmarksSimpleIcon />
            </TraceIcon>
            <TraceTitle>
              Using {memories.length} {memories.length === 1 ? "memory" : "memories"}
            </TraceTitle>
          </TraceLine>
        </TraceCollapsibleTrigger>
        <TraceCollapsibleContent>
          <ul className="flex flex-col gap-1">
            {facts.map((memory) => (
              <li key={memory.id}>{memory.content}</li>
            ))}
            {episodes.map((memory) => (
              <li key={memory.id}>
                {memory.occurredOn && (
                  <span className="mr-2 tabular-nums">
                    {episodeDate.format(new Date(memory.occurredOn))}
                  </span>
                )}
                {memory.content}
              </li>
            ))}
          </ul>
        </TraceCollapsibleContent>
      </TraceCollapsible>
    </Trace>
  );
}
