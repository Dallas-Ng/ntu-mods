"use client"

import { ChevronRight, List, PanelLeft } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger
} from "@/components/ui/drawer"

interface Props {
  /**
   * Which edge the drawer slides from, and the trigger that opens it:
   * - right: a square icon button pinned under the navbar ("On this page")
   * - left: a bar across the top of the content naming the current page
   *   (section nav, like the developer docs)
   */
  side: "left" | "right"
  title: string
  /** Shown in the left bar: the page being viewed. */
  label?: string
  /** Hides the right button, e.g. until the reader scrolls past the title. */
  hidden?: boolean
  /** Width at which the desktop side nav takes over and this trigger goes. */
  desktopFrom?: "lg" | "xl"
  /** Right button pinned under the navbar; false puts it in the page flow,
   * e.g. beside the docs bar so the two never overlap. */
  floating?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

/** The phone version of a side nav: a trigger and a drawer from that side. */
export const SideNavDrawer = ({
  side,
  title,
  label,
  hidden = false,
  desktopFrom = "lg",
  floating = true,
  open,
  onOpenChange,
  children
}: Props) => (
  <Drawer direction={side} open={open} onOpenChange={onOpenChange}>
    <DrawerTrigger asChild>
      {side === "right" ? (
        <Button
          variant="outline"
          size="icon-lg"
          aria-label={title}
          aria-hidden={hidden}
          tabIndex={hidden ? -1 : 0}
          className={cn(
            "bg-background/80 not-prose backdrop-blur-xl transition-[opacity,transform] duration-200",
            floating
              ? "fixed top-20 right-4 z-20 shadow-md"
              : "aspect-square h-auto shrink-0 self-stretch shadow-sm",
            desktopFrom === "xl" ? "xl:hidden" : "lg:hidden",
            hidden && "pointer-events-none -translate-y-2 opacity-0"
          )}>
          <List />
        </Button>
      ) : (
        <button
          type="button"
          // Below the navbar (z-10): at the end of the page the bar scrolls
          // up with its column and must slide under the navbar, not over it.
          className="bg-background/80 sticky top-[4.5rem] z-[5] flex w-full min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-xl border px-4 py-2 text-left shadow-sm backdrop-blur-xl lg:hidden">
          <PanelLeft className="text-muted-foreground size-4 shrink-0" />
          {/* The section name gives way first; the page name never shrinks and
              only truncates past 70% of the bar. */}
          <span className="text-muted-foreground min-w-0 truncate text-sm">
            {title}
          </span>
          <ChevronRight className="text-muted-foreground size-4 shrink-0" />
          <span className="max-w-[70%] shrink-0 truncate text-sm font-medium">
            {label}
          </span>
        </button>
      )}
    </DrawerTrigger>

    <DrawerContent className="p-2">
      <DrawerTitle className="px-3 pt-4 pb-3 text-base">{title}</DrawerTitle>
      <DrawerDescription className="sr-only">
        {side === "right"
          ? "Jump to a section of this page"
          : `Pages in ${title}`}
      </DrawerDescription>
      <div className="min-h-0 flex-1 overflow-y-auto pb-6">{children}</div>
    </DrawerContent>
  </Drawer>
)
