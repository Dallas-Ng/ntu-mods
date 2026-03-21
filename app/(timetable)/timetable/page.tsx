import dynamic from "next/dynamic"

import Header from "@/components/header"
import { Migration } from "@/components/migration"
import { TimetableTableLoader } from "@/components/timetable-table/table"
import MobileTimetableModifierButton from "@/components/timetable/buttons/mobile-timetable-modifier-button"
import { TimetablePlanSwitcherLoading } from "@/components/timetable/buttons/timetable-plan-switcher"
import { StarsScreenshotButtonLoading } from "@/components/timetable/buttons/timetable-screenshot-button"
import { TimetableShareButtonLoading } from "@/components/timetable/buttons/timetable-share-button"
import TimetableLegend from "@/components/timetable/timetable-legend"
import { TimetableModifierLoader } from "@/components/timetable/timetable-modifier"
import { TimetableOverviewLoading } from "@/components/timetable/timetable-overview"

const TimetableHiddenContentHelper = dynamic(
  () => import("@/components/timetable/timetable-hidden-content-helper"),
  { ssr: false }
)

const TimetableScreenshotButton = dynamic(
  () => import("@/components/timetable/buttons/timetable-screenshot-button"),
  {
    ssr: false,
    loading: () => <StarsScreenshotButtonLoading />
  }
)

// const TimetableDownloadCalendarButton = dynamic(
//   () =>
//     import("@/components/timetable/buttons/timetable-download-calendar-button"),
//   { ssr: false, loading: () => <TimetableDownloadCalendarButtonLoading /> }
// )

const TimetableShareButton = dynamic(
  () => import("@/components/timetable/buttons/timetable-share-button"),
  { ssr: false, loading: () => <TimetableShareButtonLoading /> }
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

const Page = () => {
  return (
    <>
      <Migration />

      <div className="space-y-4">
        <Header title="Timetable" />

        <div className="flex justify-between gap-2">
          <TimetablePlanSwitcher />

          <div className="flex gap-2">
            <TimetableScreenshotButton />
            {/* <TimetableDownloadCalendarButton /> */}
            <TimetableShareButton />
          </div>
        </div>

        <div className="flex h-full items-start justify-between gap-4">
          <div className="size-full space-y-4 md:w-[60%] lg:w-[70%]">
            {/* Needs these divs to make space-y-4 work in loading time */}
            <div>
              <TimetableTable />
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
