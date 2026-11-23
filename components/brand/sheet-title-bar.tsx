import type { ReactNode } from "react";
import { FloatingIconButton } from "@/components/brand/floating-icon-button";
import {
  SheetClose,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { XIcon } from "@phosphor-icons/react";

type SheetTitleBarProps = {
  title: ReactNode;
  /** Shown under the title row, or kept for screen readers only with `hideDescription`. */
  description: ReactNode;
  hideDescription?: boolean;
  /** Optional controls before the title (a back button, a badge), centred on the title line. */
  leading?: ReactNode;
  /** Top and side sheets sit under the phone's notch; bottom sheets don't. */
  atScreenTop?: boolean;
};

/**
 * The one header every sheet uses: [leading] Title [close] on a single row, all centred on the
 * title line, with the description below that row so it can never push the close button out of
 * line. Same padding everywhere (20px sides, matching sheet bodies).
 */
export function SheetTitleBar({
  title,
  description,
  hideDescription,
  leading,
  atScreenTop = true,
}: SheetTitleBarProps) {
  return (
    <div
      data-slot="sheet-header"
      className={cn(
        "grid items-center gap-x-3 gap-y-1 px-5 pb-1",
        leading
          ? "grid-cols-[auto_minmax(0,1fr)_auto]"
          : "grid-cols-[minmax(0,1fr)_auto]",
        atScreenTop ? "pt-[max(1.25rem,env(safe-area-inset-top))]" : "pt-5",
      )}
    >
      {leading && <div className="flex items-center gap-3">{leading}</div>}
      <SheetTitle className="truncate font-display text-2xl leading-tight font-semibold tracking-tight">
        {title}
      </SheetTitle>
      <SheetClose render={<FloatingIconButton aria-label="Close" />}>
        <XIcon />
      </SheetClose>
      <SheetDescription
        className={cn("col-span-full", hideDescription && "sr-only")}
      >
        {description}
      </SheetDescription>
    </div>
  );
}
