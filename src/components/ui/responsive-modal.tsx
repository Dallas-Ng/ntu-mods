"use client"

import { cn } from "@/lib/utils"
import { useSettings } from "@/hooks/use-settings"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerNestedRoot,
  DrawerTitle
} from "@/components/ui/drawer"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  description?: React.ReactNode
  /** Show the description under the title; otherwise screen readers only. */
  showDescription?: boolean
  /**
   * On phones: a drawer nested in the one it was opened from (the default),
   * or a plain drawer for a modal opened from the page itself.
   */
  nested?: boolean
  children: React.ReactNode
  /** Buttons pinned under the scrolling content, always in view. */
  footer?: React.ReactNode
  /** Keep a centred dialog on phones too, instead of a drawer. */
  dialogOnly?: boolean
  /** Extra classes for the desktop dialog. */
  className?: string
}

/**
 * A dialog on desktop and a drawer on phones. The drawer is a nested one,
 * because on a phone these are always opened from inside the "Add mods"
 * drawer: a plain drawer would fight it for the drag gesture.
 */
export const ResponsiveModal = ({
  open,
  onOpenChange,
  title,
  description,
  showDescription = false,
  nested = true,
  children,
  footer,
  dialogOnly = false,
  className
}: Props) => {
  const { isMobile } = useSettings()
  const Root = nested ? DrawerNestedRoot : Drawer

  if (isMobile && !dialogOnly)
    return (
      <Root open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="border-primary overflow-hidden p-2 !duration-150 focus:outline-none data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[calc(100svh-6rem)] data-[vaul-drawer-direction=bottom]:rounded-t-3xl data-[vaul-drawer-direction=bottom]:border-4 data-[vaul-drawer-direction=bottom]:border-b-0">
          <DrawerTitle className="flex items-center px-3 text-left text-base font-semibold">
            {title}
          </DrawerTitle>
          <DrawerDescription
            className={
              showDescription
                ? "text-muted-foreground px-3 pt-1 text-left text-sm"
                : "sr-only"
            }>
            {description ?? "Details"}
          </DrawerDescription>
          <div
            className={cn(
              "mt-4 min-h-0 flex-1 overflow-y-auto px-3",
              footer ? "pb-4" : "pb-8"
            )}>
            {children}
          </div>
          {footer && <div className="border-t px-3 pt-3 pb-4">{footer}</div>}
        </DrawerContent>
      </Root>
    )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(footer && "flex flex-col overflow-hidden", className)}>
        <DialogHeader>
          <DialogTitle className="flex items-center">{title}</DialogTitle>
          <DialogDescription
            className={showDescription ? undefined : "sr-only"}>
            {description ?? "Details"}
          </DialogDescription>
        </DialogHeader>
        {footer ? (
          <>
            <div className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1">
              {children}
            </div>
            <div className="border-t pt-4">{footer}</div>
          </>
        ) : (
          children
        )}
      </DialogContent>
    </Dialog>
  )
}
