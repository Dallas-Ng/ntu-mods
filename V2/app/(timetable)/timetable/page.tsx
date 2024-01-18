"use client"

import dynamic from "next/dynamic"

import { Skeleton } from "@/components/ui/skeleton"
import Header from "@/components/header"
import MobileTimetableModifierButton from "@/components/timetable/buttons/mobile-timetable-modifier-button"
import TimetableDownloadCalendarButton from "@/components/timetable/buttons/timetable-download-calendar-button"
import TimetableScreenshotButton from "@/components/timetable/buttons/timetable-screenshot-button"
import TimetableShareButton from "@/components/timetable/buttons/timetable-share-button"
import TimetableHiddenContentHelper from "@/components/timetable/timetable-hidden-content-helper"
import TimetableLegend from "@/components/timetable/timetable-legend"
import { TimetableModifierLoader } from "@/components/timetable/timetable-modifier"
import { TimtableOverviewLoading } from "@/components/timetable/timetable-overview"
import { TimetableTableLoader } from "@/components/timetable/timetable-table"

const TimetablePlanSwitcher = dynamic(
  () => import("@/components/timetable/buttons/timetable-plan-switcher"),
  {
    ssr: false,
    loading: () => (
      <div className="h-[36px] w-[95px] rounded-md border p-2">
        <Skeleton className="size-full" />
      </div>
    )
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
    loading: () => <TimtableOverviewLoading />
  }
)

const Page = () => {
  return (
    <>
      <div className="space-y-4">
        <Header title="Timetable" />

        <div className="flex justify-between gap-2">
          <TimetablePlanSwitcher />

          <div className="flex gap-2">
            <TimetableScreenshotButton />
            <TimetableDownloadCalendarButton />
            <TimetableShareButton />
          </div>
        </div>

        <div className="flex h-full items-start justify-between gap-4">
          <div className="size-full space-y-4 md:w-[70%]">
            {/* Needs these divs to make space-y-4 work in loading time */}
            <div>
              <TimetableTable />
            </div>

            <div>
              <TimetableOverview />
            </div>
          </div>

          <div className="hidden md:block md:w-[30%]">
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

      <div className="fixed bottom-0 left-0 h-16 w-full bg-background shadow hover:cursor-pointer dark:border-t-2 md:hidden">
        <MobileTimetableModifierButton />
      </div>
    </>
  )
}

export default Page
