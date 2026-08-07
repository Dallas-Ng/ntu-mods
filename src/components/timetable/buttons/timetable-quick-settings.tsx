"use client"

import { Settings2 } from "lucide-react"
import posthog from "posthog-js"

import { useSettings } from "@/hooks/use-settings"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import { Toggle } from "@/components/ui/toggle"

const TimetableQuickSettings = () => {
  const { settings, updateSettings } = useSettings()
  const { fullSizeBlocks, standardisedScale } = settings

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon">
          <Settings2 className="size-4" />
          <span className="sr-only">Table display settings</span>
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-72 space-y-2">
        <p className="text-sm font-medium">Table display</p>

        <Toggle
          className="h-fit w-full items-start justify-start border py-2 whitespace-normal"
          pressed={fullSizeBlocks}
          onPressedChange={(val) => {
            updateSettings({ fullSizeBlocks: val })
            posthog.capture("settings_table_changed", {
              setting: "fullSizeBlocks",
              value: val,
              source: "timetable_quick_settings"
            })
          }}>
          <div className="text-left">
            <p>Full size blocks</p>
            <span className="text-muted-foreground text-xs">
              Colour the entire timeslot, even for short lessons
            </span>
          </div>
        </Toggle>

        <Toggle
          className="h-fit w-full items-start justify-start border py-2 whitespace-normal"
          pressed={standardisedScale}
          onPressedChange={(val) => {
            updateSettings({ standardisedScale: val })
            posthog.capture("settings_table_changed", {
              setting: "standardisedScale",
              value: val,
              source: "timetable_quick_settings"
            })
          }}>
          <div className="text-left">
            <p>Standardised scale</p>
            <span className="text-muted-foreground text-xs">
              Give every 30 min timeslot the same height, so breaks and lessons
              are visually comparable
            </span>
          </div>
        </Toggle>

        <a
          href="/settings#table-settings"
          className="text-muted-foreground hover:text-foreground block text-center text-xs underline underline-offset-2">
          More table settings
        </a>
      </PopoverContent>
    </Popover>
  )
}

export default TimetableQuickSettings
