"use client"

import * as React from "react"
import { Drawer as DrawerPrimitive } from "vaul"

import { cn } from "@/lib/utils"

function Drawer({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  // Vaul's own input repositioning fights iOS and crops the top of a tall
  // drawer; DrawerContent follows the visual viewport instead.
  return (
    <DrawerPrimitive.Root
      data-slot="drawer"
      repositionInputs={false}
      {...props}
    />
  )
}

function DrawerTrigger({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Trigger>) {
  return <DrawerPrimitive.Trigger data-slot="drawer-trigger" {...props} />
}

/** A drawer opened from inside another open drawer must use this instead of
 * `Drawer` — vaul renders two independent, competing drag sheets otherwise. */
function DrawerNestedRoot({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.NestedRoot>) {
  return (
    <DrawerPrimitive.NestedRoot
      data-slot="drawer-nested"
      repositionInputs={false}
      {...props}
    />
  )
}

function DrawerPortal({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Portal>) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />
}

function DrawerClose({
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Close>) {
  return <DrawerPrimitive.Close data-slot="drawer-close" {...props} />
}

function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn(
        "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/50",
        className
      )}
      {...props}
    />
  )
}

/** Space the on-screen keyboard takes, and what is left above it. */
function useKeyboard() {
  const [kb, setKb] = React.useState<{ inset: number; height: number } | null>(
    null
  )
  React.useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const update = () => {
      const inset = window.innerHeight - vv.height - vv.offsetTop
      setKb(inset > 80 ? { inset, height: vv.height } : null)
    }
    update()
    vv.addEventListener("resize", update)
    vv.addEventListener("scroll", update)
    return () => {
      vv.removeEventListener("resize", update)
      vv.removeEventListener("scroll", update)
    }
  }, [])
  return kb
}

function DrawerContent({
  className,
  children,
  style,
  onOpenAutoFocus,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content>) {
  const kb = useKeyboard()
  return (
    <DrawerPortal data-slot="drawer-portal">
      {/* A close control, not just a backdrop: on touch, Radix waits for the
          click after a tap, and iOS Safari sends none from an element with
          no click handler, so tapping the mask did nothing. It closes even
          a dismissible={false} drawer; guard it here before adding one. */}
      <DrawerPrimitive.Close asChild>
        <DrawerOverlay />
      </DrawerPrimitive.Close>
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        className={cn(
          "group/drawer-content bg-background fixed z-50 flex h-auto flex-col data-[vaul-drawer-direction=bottom]:pt-0!",
          "data-[vaul-drawer-direction=top]:inset-x-0 data-[vaul-drawer-direction=top]:top-0 data-[vaul-drawer-direction=top]:mb-24 data-[vaul-drawer-direction=top]:max-h-[80vh] data-[vaul-drawer-direction=top]:rounded-b-lg data-[vaul-drawer-direction=top]:border-b",
          "data-[vaul-drawer-direction=bottom]:inset-x-0 data-[vaul-drawer-direction=bottom]:bottom-0 data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[80vh] data-[vaul-drawer-direction=bottom]:rounded-t-lg data-[vaul-drawer-direction=bottom]:border-t",
          "data-[vaul-drawer-direction=right]:inset-y-0 data-[vaul-drawer-direction=right]:right-0 data-[vaul-drawer-direction=right]:w-3/4 data-[vaul-drawer-direction=right]:border-l data-[vaul-drawer-direction=right]:sm:max-w-sm",
          "data-[vaul-drawer-direction=left]:inset-y-0 data-[vaul-drawer-direction=left]:left-0 data-[vaul-drawer-direction=left]:w-3/4 data-[vaul-drawer-direction=left]:border-r data-[vaul-drawer-direction=left]:sm:max-w-sm",
          className
        )}
        // Keyboard up: sit on top of it and never grow past what is visible,
        // so the focused field stays in view.
        style={
          kb ? { ...style, bottom: kb.inset, maxHeight: kb.height - 16 } : style
        }
        // vaul skips Radix's open focus, which left focus on the trigger
        // inside the now aria-hidden page (a console warning, and screen
        // readers stay behind). Focus the panel itself, not its first field,
        // so phones do not open the keyboard.
        onOpenAutoFocus={(event) => {
          onOpenAutoFocus?.(event)
          if (event.defaultPrevented) return
          event.preventDefault()
          const panel = event.target
          // An autoFocus field inside (e.g. rename plan) keeps its focus.
          if (
            panel instanceof HTMLElement &&
            !panel.contains(document.activeElement)
          )
            panel.focus({ preventScroll: true })
        }}
        {...props}>
        <div className="bg-muted mx-auto mt-4 mb-4 hidden h-2 w-[100px] shrink-0 rounded-full group-data-[vaul-drawer-direction=bottom]/drawer-content:block" />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  )
}

function DrawerHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-header"
      className={cn(
        "flex flex-col gap-0.5 px-4 pb-4 group-data-[vaul-drawer-direction=bottom]/drawer-content:text-center group-data-[vaul-drawer-direction=left]/drawer-content:pt-4 group-data-[vaul-drawer-direction=right]/drawer-content:pt-4 group-data-[vaul-drawer-direction=top]/drawer-content:pt-4 group-data-[vaul-drawer-direction=top]/drawer-content:text-center md:gap-1.5 md:text-left",
        className
      )}
      {...props}
    />
  )
}

function DrawerFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="drawer-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function DrawerTitle({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Title>) {
  return (
    <DrawerPrimitive.Title
      data-slot="drawer-title"
      className={cn("text-foreground font-semibold", className)}
      {...props}
    />
  )
}

function DrawerDescription({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Description>) {
  return (
    <DrawerPrimitive.Description
      data-slot="drawer-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  )
}

export {
  Drawer,
  DrawerNestedRoot,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription
}
