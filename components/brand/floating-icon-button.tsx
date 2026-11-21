import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

/** Round white button that floats on the page with a soft warm shadow (header actions, close, back). */
export function FloatingIconButton({ className, ...props }: ComponentProps<typeof Button>) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "size-10 rounded-full bg-card text-foreground shadow-soft hover:bg-card hover:text-foreground active:scale-95 disabled:opacity-40 [&_svg:not([class*='size-'])]:size-[18px]",
        className,
      )}
      {...props}
    />
  );
}
