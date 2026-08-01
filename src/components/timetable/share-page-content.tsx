"use client"

import { useEffect } from "react"
import posthog from "posthog-js"

import { Button } from "@/components/ui/button"
import Header from "@/components/header"
import TimetableCopyButton from "@/components/timetable/buttons/timetable-copy-button"
import TimetableDownloadCalendarButton from "@/components/timetable/buttons/timetable-download-calendar-button"
import TimetableScreenshotButton from "@/components/timetable/buttons/timetable-screenshot-button"
import TimetableLegend from "@/components/timetable/timetable-legend"
import TimetableOverview from "@/components/timetable/timetable-overview"
import TimetableTable from "@/components/timetable/timetable-table"

const SharePageContent = () => {
  useEffect(() => {
    posthog.capture("shared_timetable_viewed")
  }, [])

  return (
    <div className="space-y-4">
      <Header
        title="Timetable"
        subtitle={
          <span className="text-destructive font-semibold">Read Only</span>
        }
      />

      <div className="flex justify-between gap-2">
        <div className="flex gap-2">
          <a
            href="/timetable"
            onClick={() => posthog.capture("make_my_timetable_clicked")}>
            <Button>Make My Timetable</Button>
          </a>

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

export default SharePageContent
