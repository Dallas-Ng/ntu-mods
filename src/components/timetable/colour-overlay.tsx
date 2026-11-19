"use client"

import { useSettings } from "@/hooks/use-settings"

import {
  DrawerContent,
  DrawerDescription,
  DrawerNestedRoot,
  DrawerTitle,
  DrawerTrigger
} from "../ui/drawer"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"

interface Props {
  /** The control that opens it. Rendered as the trigger itself. */
  trigger: React.ReactNode
  title: string
  children: React.ReactNode
  /** Classes for the desktop popover. */
  className?: string
  align?: "start" | "center" | "end"
  /** Stop taps from reaching a row that is itself a trigger. */
  isolate?: boolean
}

/**
 * A popover on desktop and a bottom drawer on phones, for the colour controls.
 * The drawer is nested because both places that use it already sit inside a
 * drawer on a phone.
 */
const ColourOverlay = ({
  trigger,
  title,
  children,
  className,
  align = "start",
  isolate = false
}: Props) => {
  const { isMobile } = useSettings()

  // React bubbles portal events through the component tree, so a panel
  // inside a row that is itself a trigger would also open that row.
  const stop = isolate
    ? {
        onClick: (event: React.SyntheticEvent) => event.stopPropagation(),
        onPointerDown: (event: React.SyntheticEvent) => event.stopPropagation()
      }
    : {}

  if (isMobile)
    return (
      <DrawerNestedRoot>
        <DrawerTrigger asChild {...stop}>
          {trigger}
        </DrawerTrigger>

        <DrawerContent
          className="border-primary overflow-hidden p-2 !duration-150 focus:outline-none data-[vaul-drawer-direction=bottom]:max-h-[85svh] data-[vaul-drawer-direction=bottom]:rounded-t-3xl data-[vaul-drawer-direction=bottom]:border-4 data-[vaul-drawer-direction=bottom]:border-b-0"
          {...stop}>
          <DrawerTitle className="px-3 pt-1 text-left text-base font-semibold">
            {title}
          </DrawerTitle>
          <DrawerDescription className="sr-only">{title}</DrawerDescription>
          <div className="mt-3 min-h-0 flex-1 overflow-y-auto px-3 pb-6">
            {children}
          </div>
        </DrawerContent>
      </DrawerNestedRoot>
    )

  return (
    <Popover>
      <PopoverTrigger asChild {...stop}>
        {trigger}
      </PopoverTrigger>

      <PopoverContent
        align={align}
        className={className ?? "w-72 p-3"}
        {...stop}>
        {children}
      </PopoverContent>
    </Popover>
  )
}

export default ColourOverlay
