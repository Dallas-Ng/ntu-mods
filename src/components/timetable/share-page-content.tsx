"use client"

import { useEffect } from "react"
import { Eye } from "lucide-react"

import { track } from "@/lib/analytics"
import { useTimetable } from "@/hooks/use-timetable"
import { Button } from "@/components/ui/button"
import { TextLink } from "@/components/ui/text-link"
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

      <div className="bg-card panel-border flex flex-wrap items-center gap-x-3 gap-y-3 rounded-lg p-3 sm:p-2 sm:pl-4">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-x-1.5 text-sm font-medium whitespace-nowrap">
            <Eye className="text-muted-foreground size-4 shrink-0" />
            Shared timetable
            <span className="text-muted-foreground w-full font-normal sm:w-auto">
              <span className="hidden sm:inline">· </span>
              {count} module{count !== 1 ? "s" : ""} · read only
            </span>
          </p>
          <p className="text-muted-foreground text-xs">
            Someone shared this plan with you. Copy it to your plans to edit it
            as your own.
            <span className="hidden sm:inline">
              {" "}
              Or{" "}
              <TextLink
                href="/timetable"
                onClick={() => track("make_my_timetable_clicked")}
                variant="muted"
                className="text-foreground">
                start a new one
              </TextLink>
              .
            </span>
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:ml-auto sm:w-auto sm:flex-row">
          <TimetableCopyButton />
          <div className="grid grid-cols-2 gap-2 sm:order-first sm:flex">
            <TimetableScreenshotButton persistQuerystring labelled />
            <TimetableDownloadCalendarButton labelled />
          </div>
          <Button variant="outline" asChild className="h-10 sm:hidden">
            <a
              href="/timetable"
              onClick={() => track("make_my_timetable_clicked")}>
              Start a new timetable instead
            </a>
          </Button>
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
