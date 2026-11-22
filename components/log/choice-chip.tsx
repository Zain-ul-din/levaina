import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

type ChoiceChipProps = Omit<ComponentProps<"button">, "type"> & { selected: boolean };

/** A tappable pill that stays pressed when chosen; used for every pick on the quick-log sheet. */
export function ChoiceChip({ selected, className, ...props }: ChoiceChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "inline-flex min-h-10 items-center gap-1.5 rounded-full border px-3.5 text-[0.95rem] transition-colors outline-none",
        "focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px",
        selected
          ? "border-primary bg-(--saved) text-(--saved-foreground) font-medium"
          : "border-border bg-card text-foreground hover:bg-muted",
        className,
      )}
      {...props}
    />
  );
}

/** A labelled group of chips ("Shape", "How bad"). */
export function ChoiceGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="mb-2.5 text-sm font-semibold">{label}</legend>
      <div className="flex flex-wrap gap-2">{children}</div>
    </fieldset>
  );
}
