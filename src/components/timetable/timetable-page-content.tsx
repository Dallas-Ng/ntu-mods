"use client"

import Header from "@/components/header"
import { Migration } from "@/components/migration"
import MobileTimetableModifierButton from "@/components/timetable/buttons/mobile-timetable-modifier-button"
import TimetableActionsDropdown from "@/components/timetable/buttons/timetable-actions-dropdown"
import TimetablePlanSwitcher from "@/components/timetable/buttons/timetable-plan-switcher"
import TimetableGenerateSheet from "@/components/timetable/timetable-generate-sheet"
import TimetableHiddenContentHelper from "@/components/timetable/timetable-hidden-content-helper"
import TimetableLegend from "@/components/timetable/timetable-legend"
import TimetableModifier from "@/components/timetable/timetable-modifier"
import TimetableOverview from "@/components/timetable/timetable-overview"
import TimetableStatusStrip from "@/components/timetable/timetable-status-strip"
import TimetableTable from "@/components/timetable/timetable-table"

const TimetablePageContent = () => {
  return (
    <>
      <Migration />

      <div className="space-y-4">
        <Header title="Timetable" />

        {/* Top bar: plan switcher + generate + actions */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-2">
            <TimetablePlanSwitcher />
            <TimetableGenerateSheet />
          </div>

          <TimetableActionsDropdown />
        </div>

        {/* Main layout: left panel (desktop) | grid + strip + overview */}
        <div className="flex h-full items-start gap-4">
          {/* Left sidebar — fixed width, hidden on mobile */}
          <div className="hidden shrink-0 md:block md:w-64 lg:w-72">
            <TimetableModifier />
          </div>

          {/* Right content area — takes remaining space */}
          <div className="min-w-0 flex-1 space-y-4">
            <div>
              <TimetableTable />
            </div>

            <TimetableStatusStrip />

            <div>
              <TimetableOverview />
            </div>
          </div>
        </div>

        <div className="flex w-full flex-col gap-2">
          <div className="w-fit">
            <TimetableLegend />
          </div>

          <TimetableHiddenContentHelper />
        </div>
      </div>

      <MobileTimetableModifierButton />

      {/* Buffer for mobile bottom sheet */}
      <div className="block h-16 md:hidden" />
    </>
  )
}

export default TimetablePageContent
