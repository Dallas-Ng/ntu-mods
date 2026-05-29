"use client"

import { useEffect } from "react"
import dynamic from "next/dynamic"
import Link from "next/link"
import posthog from "posthog-js"

import { Button } from "@/components/ui/button"
import Header from "@/components/header"
import { TimetableTableLoader } from "@/components/timetable-table/table-loader"
import { TimetableCopyButtonLoading } from "@/components/timetable/buttons/timetable-copy-button-loading"
import { TimetableDownloadCalendarButtonLoading } from "@/components/timetable/buttons/timetable-download-calendar-button-loading"
import { StarsScreenshotButtonLoading } from "@/components/timetable/buttons/timetable-screenshot-button-loading"
import TimetableLegend from "@/components/timetable/timetable-legend"
import { TimetableOverviewLoading } from "@/components/timetable/timetable-overview-loading"

const TimetableOverview = dynamic(
  () => import("@/components/timetable/timetable-overview"),
  {
    ssr: false,
    loading: () => <TimetableOverviewLoading />
  }
)

const TimetableTable = dynamic(
  () => import("@/components/timetable/timetable-table"),
  {
    ssr: false,
    loading: () => <TimetableTableLoader />
  }
)

const TimetableCopyButton = dynamic(
  () => import("@/components/timetable/buttons/timetable-copy-button"),
  {
    ssr: false,
    loading: () => <TimetableCopyButtonLoading />
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
  useEffect(() => {
    posthog.capture("shared_timetable_viewed")
  }, [])

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
          <Link
            href="/timetable"
            onClick={() => posthog.capture("make_my_timetable_clicked")}>
            <Button>Make My Timetable</Button>
          </Link>

          <TimetableCopyButton />
        </div>

        <div className="flex gap-2">
          <TimetableScreenshotButton persistQuerystring />
          <TimetableDownloadCalendarButton />
        </div>
      </div>

      <p className="text-muted-foreground text-center text-sm">
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
