"use client"

import * as React from "react"
import { Dialog as SheetPrimitive } from "@base-ui/react/dialog"
import { drag } from "@/lib/feel/drag"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { XIcon } from "@phosphor-icons/react"

function Sheet({ ...props }: SheetPrimitive.Root.Props) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({ ...props }: SheetPrimitive.Trigger.Props) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({ ...props }: SheetPrimitive.Close.Props) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({ ...props }: SheetPrimitive.Portal.Props) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({ className, ...props }: SheetPrimitive.Backdrop.Props) {
  return (
    <SheetPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/10 transition-opacity duration-(--feel-slow) ease-(--feel-out) data-starting-style:opacity-0 data-ending-style:pointer-events-none data-ending-style:opacity-0 data-ending-style:duration-(--feel-leave) data-ending-style:ease-(--feel-in) supports-backdrop-filter:backdrop-blur-xs motion-reduce:duration-(--feel-base) motion-reduce:ease-(--feel-fade) motion-reduce:data-ending-style:duration-(--feel-leave-pop)",
        className
      )}
      {...props}
    />
  )
}

/**
 * Drag-to-dismiss: the sheet follows the finger toward its edge (1:1, rubber band the other
 * way) and, let go far or fast enough, carries on out and calls onDismiss. Bound to the mounted
 * popup itself (Base UI mounts it only while open), so every opening gets a fresh binding.
 */
function useSheetDrag(side: "top" | "right" | "bottom" | "left", onDismiss?: () => void) {
  const [popup, setPopup] = React.useState<HTMLElement | null>(null)
  const [backdrop, setBackdrop] = React.useState<HTMLElement | null>(null)
  const latest = React.useRef(onDismiss)
  React.useEffect(() => {
    latest.current = onDismiss
  })
  const draggable = Boolean(onDismiss)
  React.useEffect(() => {
    if (!popup || !draggable) return
    return drag(popup, {
      axis: side === "left" || side === "right" ? "x" : "y",
      dismiss: side === "left" || side === "top" ? -1 : 1,
      fade: backdrop,
      onDismiss: () => latest.current?.(),
    })
  }, [popup, backdrop, side, draggable])
  return { setPopup, setBackdrop }
}

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  onDismiss,
  ...props
}: SheetPrimitive.Popup.Props & {
  side?: "top" | "right" | "bottom" | "left"
  showCloseButton?: boolean
  /** Lets the sheet be dragged off toward its edge; called once it has gone. Close it here. */
  onDismiss?: () => void
}) {
  const { setPopup, setBackdrop } = useSheetDrag(side, onDismiss)
  return (
    <SheetPortal>
      <SheetOverlay ref={setBackdrop} />
      <SheetPrimitive.Popup
        ref={setPopup}
        data-slot="sheet-content"
        data-side={side}
        aria-modal="true"
        className={cn(
          // Slides with `translate` only, so the drag's inline transform follows the finger untimed.
          // Leaving: about half the enter time, accelerating, and taps pass through it.
          // touch-pan-*: the browser keeps scrolling across the drag axis; along it, the drag is ours.
          "fixed z-50 flex flex-col gap-4 bg-popover bg-clip-padding text-sm text-popover-foreground shadow-lg transition-[translate] duration-(--feel-slow) ease-(--feel-out) data-ending-style:pointer-events-none data-ending-style:duration-(--feel-leave) data-ending-style:ease-(--feel-in) data-[side=bottom]:touch-pan-x data-[side=top]:touch-pan-x data-[side=left]:touch-pan-y data-[side=right]:touch-pan-y data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:data-ending-style:translate-y-full data-[side=bottom]:data-starting-style:translate-y-full data-[side=left]:inset-y-0 data-[side=left]:left-0 data-[side=left]:h-full data-[side=left]:w-3/4 data-[side=left]:data-ending-style:-translate-x-full data-[side=left]:data-starting-style:-translate-x-full data-[side=right]:inset-y-0 data-[side=right]:right-0 data-[side=right]:h-full data-[side=right]:w-3/4 data-[side=right]:data-ending-style:translate-x-full data-[side=right]:data-starting-style:translate-x-full data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:data-ending-style:-translate-y-full data-[side=top]:data-starting-style:-translate-y-full data-[side=left]:sm:max-w-sm data-[side=right]:sm:max-w-sm motion-reduce:transition-opacity motion-reduce:duration-(--feel-base) motion-reduce:ease-(--feel-fade) motion-reduce:data-ending-style:duration-(--feel-leave-pop) motion-reduce:data-starting-style:translate-0! motion-reduce:data-ending-style:translate-0! motion-reduce:data-starting-style:opacity-0 motion-reduce:data-ending-style:opacity-0",
          className
        )}
        {...props}
      >
        {/* A bottom sheet that can be dragged shows it: a grab bar (the whole sheet is the handle). */}
        {onDismiss && side === "bottom" && (
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 grid h-5 place-items-center">
            <span className="h-1 w-9 rounded-full bg-foreground/20" />
          </div>
        )}
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close
            data-slot="sheet-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-3 right-3"
                size="icon-sm"
              />
            }
          >
            <XIcon
            />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Popup>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-0.5 p-4", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }: SheetPrimitive.Title.Props) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        "font-heading text-base font-medium text-foreground",
        className
      )}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: SheetPrimitive.Description.Props) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
