"use client"

import { useState } from "react"

import { useSettings } from "@/hooks/use-settings"
import { Drawer, DrawerContent } from "@/components/ui/drawer"

import TimetableModifier from "../timetable-modifier"

const MobileTimetableModifierButton = () => {
  const [snap, setSnap] = useState<number | string | null>("85px")

  const { isMobile } = useSettings()

  if (!isMobile) return null

  return (
    <Drawer
      open
      dismissible={false}
      modal={snap === "85px" ? false : true}
      snapPoints={["85px", 1]}
      activeSnapPoint={snap}
      setActiveSnapPoint={setSnap}>
      <DrawerContent
        className="h-[100svh] rounded-t-3xl border-4 border-b-0 border-primary p-2 focus:outline-none"
        onClick={() => setSnap(1)}>
        <div className="flex h-full flex-col">
          <div className="size-full flex-1">
            <TimetableModifier />
          </div>

          <p className="text-center text-sm text-muted-foreground ">
            Swipe down to close
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

export default MobileTimetableModifierButton
