"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

import { useSettings } from "@/hooks/use-settings"
import { useTimetable } from "@/hooks/use-timetable"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle
} from "@/components/ui/drawer"

import TimetableModifier from "../timetable-modifier"

const TimetableStatusStrip = dynamic(
  () => import("../timetable-status-strip"),
  { ssr: false }
)

const MobileTimetableModifierButton = () => {
  const [snap, setSnap] = useState<number | string | null>("85px")
  const { isMobile } = useSettings()
  const { timetable } = useTimetable()
  const isExpanded = snap === 1

  const moduleCount = Object.keys(timetable).length

  useEffect(() => {
    document.body.style.overflow = isExpanded ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [isExpanded])

  if (!isMobile) return null

  return (
    <>
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black/50"
          style={{ zIndex: 40 }}
          onClick={() => setSnap("85px")}
        />
      )}
      <Drawer
        key={isExpanded ? "expanded" : "collapsed"}
        open
        dismissible={false}
        modal={false}
        snapPoints={["85px", 1]}
        activeSnapPoint={snap}
        setActiveSnapPoint={setSnap}>
        <DrawerContent
          style={{ zIndex: 41 }}
          className="border-primary h-[100svh] overflow-hidden p-2 focus:outline-none data-[vaul-drawer-direction=bottom]:mt-0 data-[vaul-drawer-direction=bottom]:max-h-[100svh] data-[vaul-drawer-direction=bottom]:rounded-t-3xl data-[vaul-drawer-direction=bottom]:border-4 data-[vaul-drawer-direction=bottom]:border-b-0">
          <DrawerTitle className="sr-only">Timetable modifier</DrawerTitle>
          <DrawerDescription className="sr-only">
            Add, remove, and change timetable module indexes.
          </DrawerDescription>

          <div className="flex h-full flex-col">
            {/* Status strip pinned above handle */}
            <div className="shrink-0 px-1 pb-1">
              <TimetableStatusStrip />
            </div>

            {/* Handle / collapsed label */}
            <button
              type="button"
              className="text-muted-foreground flex h-[44px] shrink-0 items-center justify-center gap-2 text-sm"
              onClick={() => setSnap(1)}>
              <span>Modules</span>
              {moduleCount > 0 && (
                <span className="bg-primary text-primary-foreground flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold">
                  {moduleCount}
                </span>
              )}
              {moduleCount === 0 && (
                <span className="text-xs opacity-60">tap to add</span>
              )}
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
    </>
  )
}

export default MobileTimetableModifierButton
