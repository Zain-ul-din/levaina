import type { LogKind } from "@/lib/log/types";
import { cn } from "@/lib/utils";
import { BowlFoodIcon, NotePencilIcon, PulseIcon, ScalesIcon, ToiletIcon, type Icon } from "@phosphor-icons/react";

/** One icon per kind, used everywhere a log entry appears. */
export const KIND_ICONS: Record<LogKind, Icon> = {
  meal: BowlFoodIcon,
  symptom: PulseIcon,
  stool: ToiletIcon,
  weight: ScalesIcon,
  note: NotePencilIcon,
};

const SIZES = {
  sm: "size-8 [&_svg]:size-[18px]",
  lg: "size-14 [&_svg]:size-7",
} as const;

type KindBadgeProps = {
  kind: LogKind;
  size?: keyof typeof SIZES;
  className?: string;
};

/**
 * The kind's icon on a disc tinted with its own colour (--log-<kind> in globals.css).
 * Duotone keeps it soft; the colour lets a day of entries be scanned without reading.
 */
export function KindBadge({ kind, size = "sm", className }: KindBadgeProps) {
  const Icon = KIND_ICONS[kind];
  const hue = `var(--log-${kind})`;

  return (
    <span
      aria-hidden="true"
      className={cn("inline-flex shrink-0 items-center justify-center rounded-full", SIZES[size], className)}
      style={{ color: hue, backgroundColor: `color-mix(in oklch, ${hue} 14%, var(--card))` }}
    >
      <Icon weight="duotone" />
    </span>
  );
}
