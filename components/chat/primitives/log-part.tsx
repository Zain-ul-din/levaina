"use client";

import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import type { LogToolPart } from "@/lib/chat/types";
import { removeLogEntryRequest } from "@/lib/log/log-api";
import { NotePencilIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { ExpandableToolText, UndoButton } from "./tool-line";

type LogPartProps = {
  part: LogToolPart;
};

/** "13:05" in the device's zone, which is the zone the coach logged it in. */
const clock = (iso: string) =>
  new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

/** One quiet line in the Brain showing what the coach just logged ("Logged 13:00 · Lunch: dal and rice"). */
export function LogPart({ part }: LogPartProps) {
  const isRemoval = part.type === "tool-removeLogEntry";

  if (part.state === "input-streaming" || part.state === "input-available") {
    return (
      <Marker>
        <MarkerIcon>
          <NotePencilIcon />
        </MarkerIcon>
        <MarkerContent className="shimmer">{isRemoval ? "Removing from your log" : "Logging"}</MarkerContent>
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
        <MarkerContent>Couldn&apos;t update your log</MarkerContent>
      </Marker>
    );
  }

  return (
    <Marker className="items-start">
      <ExpandableToolText
        label={isRemoval ? "Removed from log" : `Logged ${clock(output.loggedAt)}`}
        text={output.text}
      />
      {!isRemoval && <UndoButton undo={() => removeLogEntryRequest(output.id)} />}
    </Marker>
  );
}
