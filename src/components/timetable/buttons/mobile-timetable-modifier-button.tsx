"use client"

import { useState } from "react"
import { ListPlus } from "lucide-react"

import { useSettings } from "@/hooks/use-settings"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger
} from "@/components/ui/drawer"

import TimetableModifier from "../timetable-modifier"

interface Props {
  hidden?: boolean
}

const MobileTimetableModifierButton = ({ hidden = false }: Props) => {
  const [open, setOpen] = useState(false)
  const { isMobile } = useSettings()

  if (!isMobile || hidden) return null

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        {/* Reuse the shared Button — a hand-rolled pill shape here would be
            the only rounded-full control in an app that's rounded-md
            everywhere else (Plan switcher, Pick indexes, ...). */}
        <Button className="fixed right-4 bottom-4 z-30 gap-2 shadow-lg">
          <ListPlus className="size-4" />
          Add mods
        </Button>
      </DrawerTrigger>

      {/* Border/radius/duration match the nested index-picker drawer
          (timetable-index-modifier.tsx) — two drawers with different
          chrome read as a mistake, not a design choice. */}
      <DrawerContent className="border-primary h-[calc(100svh-6rem)] overflow-hidden p-2 !duration-150 focus:outline-none data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[calc(100svh-6rem)] data-[vaul-drawer-direction=bottom]:rounded-t-3xl data-[vaul-drawer-direction=bottom]:border-4 data-[vaul-drawer-direction=bottom]:border-b-0">
        <DrawerTitle className="sr-only">Timetable modifier</DrawerTitle>
        <DrawerDescription className="sr-only">
          Add, remove, and change timetable module indexes.
        </DrawerDescription>

        <div className="mt-5 min-h-0 flex-1 overflow-y-auto">
          <TimetableModifier />
        </div>
      </DrawerContent>
    </Drawer>
  )
}

export default MobileTimetableModifierButton
