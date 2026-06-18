"use client"

import dynamic from "next/dynamic"

import Header from "@/components/header"
import { Migration } from "@/components/migration"
import { TimetableTableLoader } from "@/components/timetable-table/table-loader"
import { TimetablePlanSwitcherLoading } from "@/components/timetable/buttons/timetable-plan-switcher-loading"
import TimetableGenerateSheet from "@/components/timetable/timetable-generate-sheet"
import TimetableLegend from "@/components/timetable/timetable-legend"
import { TimetableModifierLoader } from "@/components/timetable/timetable-modifier-loading"
import { TimetableOverviewLoading } from "@/components/timetable/timetable-overview-loading"

const TimetableHiddenContentHelper = dynamic(
  () => import("@/components/timetable/timetable-hidden-content-helper"),
  { ssr: false }
)

const TimetableActionsDropdown = dynamic(
  () => import("@/components/timetable/buttons/timetable-actions-dropdown"),
  { ssr: false, loading: () => <div className="size-9" /> }
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

const TimetableStatusStrip = dynamic(
  () => import("@/components/timetable/timetable-status-strip"),
  { ssr: false }
)

const MobileTimetableModifierButton = dynamic(
  () =>
    import("@/components/timetable/buttons/mobile-timetable-modifier-button"),
  { ssr: false }
)

const Page = () => {
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
          {/* Left sidebar — hidden on mobile (bottom sheet handles it) */}
          <div className="hidden md:block md:w-[40%] lg:w-[30%]">
            <TimetableModifier />
          </div>

          {/* Right content area */}
          <div className="size-full space-y-4 md:w-[60%] lg:w-[70%]">
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

export default Page
