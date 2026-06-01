"use client"

import { useEffect, useState } from "react"
import { useBoundState } from "@/state/bound.state"

import { useSettings } from "@/hooks/use-settings"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle
} from "@/components/ui/drawer"

import MobileGenerationPeek from "../mode-generation/mobile-generation-peek"
import TimetableModifier from "../timetable-modifier"

interface Props {
  hidden?: boolean
}

const MobileTimetableModifierButton = ({ hidden = false }: Props) => {
  const [snap, setSnap] = useState<number | string | null>("85px")
  const { isMobile } = useSettings()
  const mode = useBoundState((s) => s.timetableCreationMode)
  const isExpanded = snap === 1
  const isGenerateMode = mode === "generation"

  useEffect(() => {
    document.body.style.overflow = isExpanded ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [isExpanded])

  useEffect(() => {
    if (isGenerateMode) setSnap("85px")
  }, [isGenerateMode])

  if (!isMobile || hidden) return null

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
            {isGenerateMode ? (
              <MobileGenerationPeek onExpand={() => setSnap(1)} />
            ) : (
              <button
                type="button"
                className="text-muted-foreground flex h-[59px] shrink-0 items-center justify-center text-sm"
                onClick={() => setSnap(1)}>
                Click here to add mods!
              </button>
            )}

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
