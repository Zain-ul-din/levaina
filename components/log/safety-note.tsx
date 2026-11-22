import { FirstAidKitIcon } from "@phosphor-icons/react";
import type { ReactNode } from "react";

/**
 * A calm but unmissable note for warning signs (red or black stool, severe pain).
 * Warm terracotta, not alarm red: it should make people act, not panic.
 */
export function SafetyNote({ children }: { children: ReactNode }) {
  return (
    <p
      role="note"
      className="flex gap-3 rounded-2xl border border-destructive/25 bg-destructive/8 p-4 text-[0.95rem] leading-relaxed text-foreground"
    >
      <FirstAidKitIcon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-destructive" />
      <span>{children}</span>
    </p>
  );
}
