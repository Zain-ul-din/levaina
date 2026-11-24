"use client";

import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import type { ResearchToolPart } from "@/lib/chat/types";
import { cn } from "@/lib/utils";
import { BooksIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { useState } from "react";

type ResearchPartProps = {
  part: ResearchToolPart;
};

/**
 * One quiet line showing the coach looked something up ("Looked up 5 sources"); tap it to see
 * the sources, each a link to the original, so the user can check where advice came from.
 */
export function ResearchPart({ part }: ResearchPartProps) {
  const [open, setOpen] = useState(false);

  if (part.state === "input-streaming" || part.state === "input-available") {
    return (
      <Marker>
        <MarkerIcon>
          <BooksIcon />
        </MarkerIcon>
        <MarkerContent className="shimmer">Looking up research</MarkerContent>
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
        <MarkerContent>Couldn&apos;t look up research</MarkerContent>
      </Marker>
    );
  }

  const count = output.results.length;
  if (count === 0) {
    return (
      <Marker>
        <MarkerIcon>
          <BooksIcon />
        </MarkerIcon>
        <MarkerContent>Found no research on this</MarkerContent>
      </Marker>
    );
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Marker>
        <MarkerIcon>
          <BooksIcon />
        </MarkerIcon>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="cursor-pointer rounded-sm py-0.5 text-left outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          Looked up {count} {count === 1 ? "source" : "sources"}
        </button>
      </Marker>
      <ul className={cn("ml-7 flex flex-col gap-1.5 text-sm", !open && "hidden")}>
        {output.results.map((result) => (
          <li key={result.url} className="min-w-0">
            {/* Only https links from the search results; they open outside the app. */}
            {result.url.startsWith("https://") ? (
              <a href={result.url} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
                {result.title}
              </a>
            ) : (
              result.title
            )}
            <span className="text-muted-foreground">
              {" "}
              · {result.source}
              {result.year ? `, ${result.year}` : ""}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
