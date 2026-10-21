"use client"

import { useEffect } from "react"
import { Eye } from "lucide-react"

import { track } from "@/lib/analytics"
import { useTimetable } from "@/hooks/use-timetable"
import TimetableCopyButton from "@/components/timetable/buttons/timetable-copy-button"
import TimetableDownloadCalendarButton from "@/components/timetable/buttons/timetable-download-calendar-button"
import TimetableScreenshotButton from "@/components/timetable/buttons/timetable-screenshot-button"
import TimetableLegend from "@/components/timetable/timetable-legend"
import TimetableOverview from "@/components/timetable/timetable-overview"
import TimetableTable from "@/components/timetable/timetable-table"

const SharePageContent = () => {
  const { qsTimetable } = useTimetable()
  const count = Object.keys(qsTimetable ?? {}).length

  useEffect(() => {
    track("shared_timetable_viewed")
  }, [])

  return (
    <div className="space-y-4">
      {/* Kept for SEO and screen readers, hidden from view. */}
      <h1 className="sr-only">Shared timetable</h1>

      <div className="bg-card panel-border flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg p-2 pl-4">
        <div className="mr-auto min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-medium">
            <Eye className="text-muted-foreground size-4 shrink-0" />
            Shared timetable
            <span className="text-muted-foreground font-normal">
              · {count} module{count !== 1 ? "s" : ""} · read only
            </span>
          </p>
          <p className="text-muted-foreground text-xs">
            Someone shared this plan with you. Copy it to edit your own, or{" "}
            <a
              href="/timetable"
              onClick={() => track("make_my_timetable_clicked")}
              className="text-foreground underline underline-offset-2">
              start a new one
            </a>
            .
          </p>
        </div>

        <div className="flex gap-2">
          <TimetableScreenshotButton persistQuerystring />
          <TimetableDownloadCalendarButton />
          <TimetableCopyButton />
        </div>
      </div>

      <TimetableTable />

      <div className="w-fit">
        <TimetableLegend />
      </div>

      <TimetableOverview />
    </div>
  )
}

export default SharePageContent
