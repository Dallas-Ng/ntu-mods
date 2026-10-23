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
            "bg-background/80 not-prose fixed top-20 right-4 z-20 shadow-md backdrop-blur-xl transition-[opacity,transform] duration-200 lg:hidden",
            hidden && "pointer-events-none -translate-y-2 opacity-0"
          )}>
          <List />
        </Button>
      ) : (
        <button
          type="button"
          className="bg-background/80 sticky top-[4.5rem] z-10 flex w-full cursor-pointer items-center gap-3 rounded-xl border px-4 py-2 text-left shadow-sm backdrop-blur-xl lg:hidden">
          <PanelLeft className="text-muted-foreground size-4 shrink-0" />
          <span className="text-muted-foreground shrink-0 text-sm">
            {title}
          </span>
          <ChevronRight className="text-muted-foreground/60 size-3.5 shrink-0" />
          <span className="truncate text-sm font-medium">{label}</span>
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
