"use client";

import { SEVERITY_LABELS, SYMPTOM_LABELS } from "@/lib/log/labels";
import { SEVERITIES, SYMPTOMS, type Symptom } from "@/lib/log/types";
import { useState } from "react";
import { ChoiceChip, ChoiceGroup } from "../choice-chip";
import { LogFormShell } from "../log-form-shell";
import type { LogFormProps } from "./form-props";

/** Pick one or more symptoms and how bad they are. */
export function SymptomForm(props: LogFormProps) {
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [severity, setSeverity] = useState<(typeof SEVERITIES)[number] | null>(null);

  const toggle = (symptom: Symptom) =>
    setSymptoms((current) => (current.includes(symptom) ? current.filter((s) => s !== symptom) : [...current, symptom]));

  const content =
    symptoms.length > 0 && severity ? { kind: "symptom" as const, details: { symptoms, severity } } : null;

  return (
    <LogFormShell content={content} {...props}>
      <ChoiceGroup label="What did you feel?">
        {SYMPTOMS.map((symptom) => (
          <ChoiceChip key={symptom} selected={symptoms.includes(symptom)} onClick={() => toggle(symptom)}>
            {SYMPTOM_LABELS[symptom]}
          </ChoiceChip>
        ))}
      </ChoiceGroup>

      <ChoiceGroup label="How bad?">
        {SEVERITIES.map((value) => (
          <ChoiceChip key={value} selected={severity === value} onClick={() => setSeverity(value)}>
            {SEVERITY_LABELS[value]}
          </ChoiceChip>
        ))}
      </ChoiceGroup>
    </LogFormShell>
  );
}
