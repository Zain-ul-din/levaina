import type { Icon } from "@phosphor-icons/react";
import { BookmarkSimpleIcon, BowlFoodIcon, ScalesIcon, SparkleIcon } from "@phosphor-icons/react/dist/ssr";

/**
 * What Levaina actually does, in short lines: the reason to sign up, shown before signing up.
 * `tall` lines appear only on taller screens, where the card has room; short phones keep three.
 */
const PROMISES: { icon: Icon; title: string; text: string; tall?: boolean }[] = [
  { icon: BowlFoodIcon, title: "Knows your gut", text: "Learns which foods agree with you" },
  { icon: ScalesIcon, title: "Fits your weight goal", text: "Gaining, losing or holding, gently" },
  { icon: SparkleIcon, title: "Spots patterns", text: "In what you eat and how you feel" },
  { icon: BookmarkSimpleIcon, title: "Remembers you", text: "And forgets anything on request", tall: true },
];

export function SignInPromises({ className }: { className?: string }) {
  return (
    <ul className={["flex flex-col gap-5", className].filter(Boolean).join(" ")}>
      {PROMISES.map(({ icon: PromiseIcon, title, text, tall }) => (
        <li key={title} className={["flex items-center gap-3.5", tall ? "[@media(max-height:740px)]:hidden" : ""].join(" ")}>
          <span aria-hidden="true" className="grid size-11 shrink-0 place-items-center rounded-full bg-(--glass-field) text-primary">
            <PromiseIcon weight="duotone" className="size-5" />
          </span>
          <span className="flex flex-col">
            <span className="text-[0.9375rem] leading-snug font-medium">{title}</span>
            <span className="text-sm leading-snug text-muted-foreground">{text}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
