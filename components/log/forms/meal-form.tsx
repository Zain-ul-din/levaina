"use client";

import { mealTypeForHour } from "@/lib/log/device-time";
import { MEAL_TYPE_LABELS } from "@/lib/log/labels";
import { MEAL_TYPES, type MealType } from "@/lib/log/types";
import { useState } from "react";
import { ChoiceChip, ChoiceGroup } from "../choice-chip";
import { LogFormShell } from "../log-form-shell";
import type { LogFormProps } from "./form-props";

/** Free text in their own words (the coach reads it), plus which meal, guessed from the time of day. */
export function MealForm(props: LogFormProps) {
  const [description, setDescription] = useState("");
  const [mealType, setMealType] = useState<MealType>(() => mealTypeForHour(new Date().getHours()));
  const text = description.trim();
  const content = text ? { kind: "meal" as const, details: { description: text.slice(0, 500), mealType } } : null;

  return (
    <LogFormShell content={content} {...props}>
      <label className="flex flex-col gap-2.5">
        <span className="text-sm font-semibold">What did you have?</span>
        <textarea
          autoFocus
          rows={3}
          maxLength={500}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Dal and rice with raita, a cup of chai"
          className="resize-none rounded-xl border border-border bg-card px-3.5 py-3 text-base leading-relaxed outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </label>

      <ChoiceGroup label="Which meal">
        {MEAL_TYPES.map((value) => (
          <ChoiceChip key={value} selected={mealType === value} onClick={() => setMealType(value)}>
            {MEAL_TYPE_LABELS[value]}
          </ChoiceChip>
        ))}
      </ChoiceGroup>
    </LogFormShell>
  );
}
