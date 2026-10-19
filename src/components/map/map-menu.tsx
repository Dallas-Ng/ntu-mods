import type { ReactNode } from "react"

import { cn } from "@/lib/utils"
import { useMediaQuery } from "@/hooks/use-media-query"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger
} from "@/components/ui/drawer"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"

/** A popover on desktop, a bottom drawer on phones where it is easier to reach. */
export const MapMenu = ({
  trigger,
  title,
  open,
  onOpenChange,
  className,
  children
}: {
  trigger: ReactNode
  title: string
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** Popover sizing; the drawer is always full width. */
  className?: string
  children: ReactNode
}) => {
  const desktop = useMediaQuery("(min-width: 1024px)")

  if (desktop)
    return (
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>{trigger}</PopoverTrigger>
        <PopoverContent align="end" className={cn("rounded-xl", className)}>
          {children}
        </PopoverContent>
      </Popover>
    )

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>{trigger}</DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-6">{children}</div>
      </DrawerContent>
    </Drawer>
  )
}
