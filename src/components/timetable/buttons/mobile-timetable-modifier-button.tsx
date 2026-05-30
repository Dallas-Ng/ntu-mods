"use client"

import { useState } from "react"

import { useSettings } from "@/hooks/use-settings"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle
} from "@/components/ui/drawer"

import TimetableModifier from "../timetable-modifier"

const MobileTimetableModifierButton = () => {
  const [snap, setSnap] = useState<number | string | null>("85px")
  const { isMobile } = useSettings()
  const isExpanded = snap === 1

  if (!isMobile) return null

  return (
    <Drawer
      key={isExpanded ? "expanded" : "collapsed"}
      open
      dismissible={false}
      modal={isExpanded}
      snapPoints={["85px", 1]}
      activeSnapPoint={snap}
      setActiveSnapPoint={setSnap}>
      <DrawerContent style={{ zIndex: 40 }} className="border-primary h-[100svh] overflow-hidden p-2 focus:outline-none data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:max-h-[100svh] data-[vaul-drawer-direction=bottom]:rounded-t-3xl data-[vaul-drawer-direction=bottom]:border-4 data-[vaul-drawer-direction=bottom]:border-b-0">
        <DrawerTitle className="sr-only">Timetable modifier</DrawerTitle>
        <DrawerDescription className="sr-only">
          Add, remove, and change timetable module indexes.
        </DrawerDescription>

        <div className="flex h-full flex-col">
          <button
            type="button"
            className="text-muted-foreground flex h-[59px] shrink-0 items-center justify-center text-sm"
            onClick={() => setSnap(1)}>
            Click here to add mods!
          </button>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <TimetableModifier />
          </div>

          <p
            className="text-muted-foreground shrink-0 text-center text-sm"
            onClick={() => setSnap("85px")}>
            Swipe down or click here to close
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

export default MobileTimetableModifierButton
