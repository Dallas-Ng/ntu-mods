import dynamic from "next/dynamic"

import { Button } from "@/components/ui/button"
import Header from "@/components/header"
import { TimetableDownloadCalendarButtonLoading } from "@/components/timetable/buttons/timetable-download-calendar-button"
import { StarsScreenshotButtonLoading } from "@/components/timetable/buttons/timetable-screenshot-button"
import TimetableLegend from "@/components/timetable/timetable-legend"
import { TimetableOverviewLoading } from "@/components/timetable/timetable-overview"
import TimetableTable from "@/components/timetable/timetable-table"

const TimetableOverview = dynamic(
  () => import("@/components/timetable/timetable-overview"),
  {
    ssr: false,
    loading: () => <TimetableOverviewLoading />
  }
)

const TimetableScreenshotButton = dynamic(
  () => import("@/components/timetable/buttons/timetable-screenshot-button"),
  {
    ssr: false,
    loading: () => <StarsScreenshotButtonLoading />
  }
)

const TimetableDownloadCalendarButton = dynamic(
  () =>
    import("@/components/timetable/buttons/timetable-download-calendar-button"),
  { ssr: false, loading: () => <TimetableDownloadCalendarButtonLoading /> }
)

const Page = () => {
  return (
    <div className="space-y-4">
      <Header
        title="Timetable"
        subtitle={
          <span className="font-semibold text-rose-600">Read Only</span>
        }
      />

      <div className="flex justify-between gap-2">
        <div className="flex gap-2">
          <Button>Make New Timetable</Button>
          <Button variant="outline">Copy Timetable</Button>
        </div>

        <div className="flex gap-2">
          <TimetableScreenshotButton persistQuerystring />
          <TimetableDownloadCalendarButton />
        </div>
      </div>

      <p className="text-center text-sm text-secondary">
        This timetable is being shared by someone.{" "}
        <br className="block md:hidden" />
        Copy the timetable to edit!
      </p>

      <TimetableTable />

      <div className="w-fit">
        <TimetableLegend />
      </div>

      <TimetableOverview />
    </div>
  )
}

export default Page
