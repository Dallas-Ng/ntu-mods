"use client"

import { WandIcon, XIcon } from "lucide-react"
import posthog from "posthog-js"

import { useTimetable } from "@/hooks/use-timetable"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger
} from "@/components/ui/drawer"

import TimetableGenerationConfig from "./mode-generation/timetable-generation-config"

interface Props {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  trigger?: React.ReactNode
}

const TimetableGenerateSheet = ({ open, onOpenChange, trigger }: Props) => {
  const { timetable } = useTimetable()

  const defaultTrigger = (
    <Button
      variant="default"
      size="sm"
      className="gap-1.5"
      onClick={() =>
        posthog.capture("generate_sheet_opened", {
          module_count: Object.keys(timetable).length
        })
      }>
      <WandIcon className="size-3.5" />
      Generate
    </Button>
  )

  return (
    <Drawer direction="right" open={open} onOpenChange={onOpenChange}>
      <DrawerTrigger asChild>{trigger ?? defaultTrigger}</DrawerTrigger>
      <DrawerContent className="flex flex-col overflow-hidden sm:max-w-md">
        <DrawerHeader className="flex-row items-center justify-between border-b pb-3">
          <div>
            <DrawerTitle className="flex items-center gap-1.5">
              <WandIcon className="size-4" />
              Generate Timetable
            </DrawerTitle>
            <DrawerDescription className="text-xs">
              Tune constraints, preview results, and apply to your plan
            </DrawerDescription>
          </div>
          <DrawerClose asChild>
            <Button variant="ghost" size="icon" className="size-8 shrink-0">
              <XIcon className="size-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DrawerClose>
        </DrawerHeader>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <TimetableGenerationConfig />
        </div>
      </DrawerContent>
    </Drawer>
  )
}

export default TimetableGenerateSheet
