"use client";

import { STOOL_COLOR_SWATCHES } from "@/lib/log/labels";
import { STOOL_COLORS, STOOL_TYPES, type StoolColor } from "@/lib/log/types";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { ChoiceChip, ChoiceGroup } from "../choice-chip";
import { LogFormShell } from "../log-form-shell";
import type { LogFormProps } from "./form-props";

/** undefined = not picked yet; null = "not sure" / "didn't look", a real answer. */
type Choice<T> = T | null | undefined;

/**
 * Shape (plain Bristol names, number for reference) and colour. Either one is enough to save:
 * someone may only notice the colour, and a warning colour must show its note straight away.
 */
export function StoolForm(props: LogFormProps) {
  const [bristol, setBristol] = useState<Choice<number>>(undefined);
  const [color, setColor] = useState<Choice<StoolColor>>(undefined);

  const content =
    bristol === undefined && color === undefined
      ? null
      : { kind: "stool" as const, details: { bristol: bristol ?? null, color: color ?? null } };

  return (
    <LogFormShell content={content} {...props}>
      <ChoiceGroup label="Shape">
        {STOOL_TYPES.map((type) => (
          <ChoiceChip key={type.bristol} selected={bristol === type.bristol} onClick={() => setBristol(type.bristol)}>
            {type.name}
            <span className="text-xs text-muted-foreground tabular-nums">· {type.bristol}</span>
          </ChoiceChip>
        ))}
        <ChoiceChip selected={bristol === null} onClick={() => setBristol(null)}>
          Not sure
        </ChoiceChip>
      </ChoiceGroup>

      <ChoiceGroup label="Colour">
        {STOOL_COLORS.map((value) => (
          <ChoiceChip key={value} selected={color === value} onClick={() => setColor(color === value ? undefined : value)}>
            <span
              aria-hidden="true"
              // A visible edge, so black reads on a dark background and pale on a light one.
              className={cn("size-4 rounded-full ring-1 ring-foreground/35")}
              style={{ backgroundColor: STOOL_COLOR_SWATCHES[value].swatch }}
            />
            {STOOL_COLOR_SWATCHES[value].label}
          </ChoiceChip>
        ))}
      </ChoiceGroup>
    </LogFormShell>
  );
}
