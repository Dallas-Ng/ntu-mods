"use client"

import { useEffect, useState } from "react"
import { PanelBottom, X } from "lucide-react"

import { track } from "@/lib/analytics"
import { useSettings } from "@/hooks/use-settings"
import { Button } from "@/components/ui/button"
import { Migration } from "@/components/migration"
import MobileTimetableModifierButton from "@/components/timetable/buttons/mobile-timetable-modifier-button"
import TimetableActionsDropdown from "@/components/timetable/buttons/timetable-actions-dropdown"
import TimetablePlanSwitcher from "@/components/timetable/buttons/timetable-plan-switcher"
import TimetableHiddenContentHelper from "@/components/timetable/timetable-hidden-content-helper"
import TimetableLegend from "@/components/timetable/timetable-legend"
import TimetableModifier from "@/components/timetable/timetable-modifier"
import TimetableOverview from "@/components/timetable/timetable-overview"
import TimetableTable from "@/components/timetable/timetable-table"

const LAYOUT_HINT_KEY = "ntumods-timetable-layout-hint"

const TimetablePageContent = () => {
  const [indexPickerEnabled, setIndexPickerEnabled] = useState(false)

  const toggleIndexPicker = () => {
    setIndexPickerEnabled((v) => {
      track("index_picker_toggled", { enabled: !v })
      return !v
    })
  }

  const { settings, updateSettings } = useSettings()
  const below = settings.timetableLayout === "below"

  // The grid scrolls sideways when the side panel leaves it too little room:
  // suggest the layout with the panel below, once.
  const [overflow, setOverflow] = useState(false)
  const [hintDismissed, setHintDismissed] = useState(true)
  useEffect(() => {
    try {
      setHintDismissed(localStorage.getItem(LAYOUT_HINT_KEY) === "1")
    } catch {
      setHintDismissed(false)
    }
  }, [])
  const dismissHint = () => {
    setHintDismissed(true)
    try {
      localStorage.setItem(LAYOUT_HINT_KEY, "1")
    } catch {}
  }

  // The module table, legend and hidden-content note under the grid.
  const details = (
    <div className="space-y-8">
      <div className="space-y-2">
        <TimetableOverview />

        <div className="w-fit">
          <TimetableLegend />
        </div>
      </div>

      <TimetableHiddenContentHelper />
    </div>
  )

  return (
    <>
      <Migration />

      <div className="space-y-4">
        {/* Kept for SEO and screen readers, hidden from view. */}
        <h1 className="sr-only">Timetable</h1>

        <div className="bg-card relative flex items-center gap-1 rounded-lg border p-1">
          <TimetablePlanSwitcher />

          <TimetableActionsDropdown
            indexPickerEnabled={indexPickerEnabled}
            onToggleIndexPicker={toggleIndexPicker}
          />
        </div>

        {overflow && !below && !hintDismissed && (
          <div
            role="status"
            className="bg-muted hidden items-center gap-3 rounded-lg border px-3 py-2 text-sm md:flex">
            <PanelBottom className="text-muted-foreground size-4 shrink-0" />
            <span className="flex-1">
              This timetable is wide. Put the panel below to give it the full
              width.
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                updateSettings({ timetableLayout: "below" })
                track("timetable_layout_changed", {
                  layout: "below",
                  source: "hint"
                })
              }}>
              Panel below
            </Button>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={dismissHint}
              className="text-muted-foreground hover:text-foreground cursor-pointer">
              <X className="size-4" />
            </button>
          </div>
        )}

        {below ? (
          <div className="space-y-4">
            <TimetableTable
              indexPickerEnabled={indexPickerEnabled}
              onOverflowChange={setOverflow}
            />
            {/* Phones keep the drawer, so this is md and up only. */}
            <div className="hidden md:block">
              <TimetableModifier horizontal />
            </div>
            {details}
          </div>
        ) : (
          <div className="flex h-full items-start justify-between gap-4">
            <div className="size-full space-y-4 md:w-[60%] lg:w-[70%]">
              <div>
                <TimetableTable
                  indexPickerEnabled={indexPickerEnabled}
                  onOverflowChange={setOverflow}
                />
              </div>

              {details}
            </div>

            <div className="hidden md:block md:w-[40%] lg:w-[30%]">
              <TimetableModifier />
            </div>
          </div>
        )}
      </div>

      <MobileTimetableModifierButton hidden={indexPickerEnabled} />
    </>
  )
}

export default TimetablePageContent
