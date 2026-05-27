"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { MousePointerClick } from "lucide-react"
import posthog from "posthog-js"

import { Button } from "@/components/ui/button"
import Header from "@/components/header"
import { Migration } from "@/components/migration"
import { TimetableTableLoader } from "@/components/timetable-table/table-loader"
import { TimetableActionsDropdownLoading } from "@/components/timetable/buttons/timetable-actions-dropdown-loading"
import { TimetablePlanSwitcherLoading } from "@/components/timetable/buttons/timetable-plan-switcher-loading"
import TimetableLegend from "@/components/timetable/timetable-legend"
import { TimetableModifierLoader } from "@/components/timetable/timetable-modifier-loading"
import { TimetableOverviewLoading } from "@/components/timetable/timetable-overview-loading"

const TimetableHiddenContentHelper = dynamic(
  () => import("@/components/timetable/timetable-hidden-content-helper"),
  { ssr: false }
)

const TimetableActionsDropdown = dynamic(
  () => import("@/components/timetable/buttons/timetable-actions-dropdown"),
  { ssr: false, loading: () => <TimetableActionsDropdownLoading /> }
)

const TimetablePlanSwitcher = dynamic(
  () => import("@/components/timetable/buttons/timetable-plan-switcher"),
  {
    ssr: false,
    loading: () => <TimetablePlanSwitcherLoading />
  }
)

const TimetableModifier = dynamic(
  () => import("@/components/timetable/timetable-modifier"),
  {
    ssr: false,
    loading: () => <TimetableModifierLoader />
  }
)

const TimetableTable = dynamic(
  () => import("@/components/timetable/timetable-table"),
  {
    ssr: false,
    loading: () => <TimetableTableLoader />
  }
)

const TimetableOverview = dynamic(
  () => import("@/components/timetable/timetable-overview"),
  {
    ssr: false,
    loading: () => <TimetableOverviewLoading />
  }
)

const MobileTimetableModifierButton = dynamic(
  () =>
    import("@/components/timetable/buttons/mobile-timetable-modifier-button"),
  { ssr: false }
)

const Page = () => {
  const [indexPickerEnabled, setIndexPickerEnabled] = useState(false)

  return (
    <>
      <Migration />

      <div className="space-y-4">
        <Header title="Timetable" />

        <div className="flex justify-between gap-2">
          <div className="flex gap-2">
            <TimetablePlanSwitcher />

            <Button
              variant={indexPickerEnabled ? "default" : "outline"}
              className="w-35 gap-2"
              onClick={() => {
                setIndexPickerEnabled((v) => {
                  posthog.capture("index_picker_toggled", { enabled: !v })
                  return !v
                })
              }}>
              <MousePointerClick className="size-4" />
              {indexPickerEnabled ? "Stop picking" : "Pick indexes"}
            </Button>

            {indexPickerEnabled && (
              <span className="text-muted-foreground hidden self-center text-xs sm:inline">
                Tap a block to see its other indexes
              </span>
            )}
          </div>

          <TimetableActionsDropdown />
        </div>

        <div className="flex h-full items-start justify-between gap-4">
          <div className="size-full space-y-4 md:w-[60%] lg:w-[70%]">
            {/* Needs these divs to make space-y-4 work in loading time */}
            <div>
              <TimetableTable indexPickerEnabled={indexPickerEnabled} />
            </div>

            <div>
              <TimetableOverview />
            </div>
          </div>

          <div className="hidden md:block md:w-[40%] lg:w-[30%]">
            <TimetableModifier />
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

      {/* Buffer for button */}
      <div className="block h-16 md:hidden" />
    </>
  )
}

export default Page
