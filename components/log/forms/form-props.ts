import type { AddLogEntryInput } from "@/lib/log/log-api";

/** What the quick-log sheet hands every kind's form. */
export type LogFormProps = {
  onSubmit: (input: AddLogEntryInput) => void;
  isSaving: boolean;
  error: string | null;
};
