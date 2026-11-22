"use client";

import { weightDetailsSchema } from "@/lib/log/types";
import { useState } from "react";
import { LogFormShell } from "../log-form-shell";
import type { LogFormProps } from "./form-props";

/** One number in kilograms; the same schema as the coach's tool decides what's valid. */
export function WeightForm(props: LogFormProps) {
  const [text, setText] = useState("");
  // Accept a comma as the decimal mark too ("61,4"), as many keyboards type it.
  const parsed = weightDetailsSchema.safeParse({ kg: Number(text.replace(",", ".")) });
  const content = text.trim() && parsed.success ? { kind: "weight" as const, details: parsed.data } : null;

  return (
    <LogFormShell content={content} {...props}>
      <label className="flex flex-col gap-2.5">
        <span className="text-sm font-semibold">Weight</span>
        <span className="flex items-center gap-3">
          <input
            inputMode="decimal"
            autoFocus
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="61.4"
            aria-label="Weight in kilograms"
            className="h-14 w-40 rounded-xl border border-border bg-card px-4 font-display text-2xl tabular-nums outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          />
          <span className="text-lg text-muted-foreground">kg</span>
        </span>
      </label>
    </LogFormShell>
  );
}
