"use client"

import { useState } from "react"
import posthog from "posthog-js"

import Header from "@/components/header"
import { Migration } from "@/components/migration"
import MobileTimetableModifierButton from "@/components/timetable/buttons/mobile-timetable-modifier-button"
import TimetableActionsDropdown from "@/components/timetable/buttons/timetable-actions-dropdown"
import TimetablePlanSwitcher from "@/components/timetable/buttons/timetable-plan-switcher"
import TimetableSettingsDialog from "@/components/timetable/buttons/timetable-settings-dialog"
import TimetableHiddenContentHelper from "@/components/timetable/timetable-hidden-content-helper"
import TimetableLegend from "@/components/timetable/timetable-legend"
import TimetableModifier from "@/components/timetable/timetable-modifier"
import TimetableOverview from "@/components/timetable/timetable-overview"
import TimetableTable from "@/components/timetable/timetable-table"

const TimetablePageContent = () => {
  const [indexPickerEnabled, setIndexPickerEnabled] = useState(false)

  const toggleIndexPicker = () => {
    setIndexPickerEnabled((v) => {
      posthog.capture("index_picker_toggled", { enabled: !v })
      return !v
    })
  }

  return (
    <>
      <Migration />

      <div className="space-y-4">
        <Header title="Timetable" />

        <div className="flex justify-between gap-2">
          <div className="flex items-center gap-2">
            <TimetablePlanSwitcher />

            {indexPickerEnabled && (
              <span className="text-muted-foreground hidden text-xs sm:inline">
                Tap a block to see its other indexes
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <TimetableSettingsDialog />
            <TimetableActionsDropdown
              indexPickerEnabled={indexPickerEnabled}
              onToggleIndexPicker={toggleIndexPicker}
            />
          </div>
        </div>

        <div className="flex h-full items-start justify-between gap-4">
          <div className="size-full space-y-4 md:w-[60%] lg:w-[70%]">
            <div>
              <TimetableTable indexPickerEnabled={indexPickerEnabled} />
            </div>

            <div className="space-y-8">
              <div className="space-y-2">
                <TimetableOverview />

                <div className="w-fit">
                  <TimetableLegend />
                </div>
              </div>

              <TimetableHiddenContentHelper />
            </div>
          </div>

          <div className="hidden md:block md:w-[40%] lg:w-[30%]">
            <TimetableModifier />
          </div>
        </div>
      </div>

      <MobileTimetableModifierButton hidden={indexPickerEnabled} />
    </>
  )
}

export default TimetablePageContent
