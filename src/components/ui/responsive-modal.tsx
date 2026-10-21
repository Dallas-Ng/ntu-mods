"use client"

import { useSettings } from "@/hooks/use-settings"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import {
  DrawerContent,
  DrawerDescription,
  DrawerNestedRoot,
  DrawerTitle
} from "@/components/ui/drawer"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: React.ReactNode
  /** Read by screen readers only. */
  description?: string
  children: React.ReactNode
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
  children,
  className
}: Props) => {
  const { isMobile } = useSettings()

  if (isMobile)
    return (
      <DrawerNestedRoot open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="border-primary h-[calc(100svh-6rem)] overflow-hidden p-2 !duration-150 focus:outline-none data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[calc(100svh-6rem)] data-[vaul-drawer-direction=bottom]:rounded-t-3xl data-[vaul-drawer-direction=bottom]:border-4 data-[vaul-drawer-direction=bottom]:border-b-0">
          <DrawerTitle className="flex items-center px-3 pt-4 text-left text-base font-semibold">
            {title}
          </DrawerTitle>
          <DrawerDescription className="sr-only">
            {description ?? "Details"}
          </DrawerDescription>
          <div className="mt-3 min-h-0 flex-1 overflow-y-auto px-3 pb-8">
            {children}
          </div>
        </DrawerContent>
      </DrawerNestedRoot>
    )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={className}>
        <DialogHeader>
          <DialogTitle className="flex items-center">{title}</DialogTitle>
          <DialogDescription className="sr-only">
            {description ?? "Details"}
          </DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  )
}
