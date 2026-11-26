import { useState } from "react"
import { CalendarPlus } from "lucide-react"

import { siteConfig } from "@/config/site"
import { useHydrated } from "@/hooks/use-hydrated"
import type { AcademicYearCalendar } from "@/lib/academic-calendar"
import {
  calendarStatus,
  semesterName,
  type CalendarStatus as Status
} from "@/lib/academic-calendar-events"
import { track } from "@/lib/analytics"
import { formatDayShort } from "@/lib/calendar-format"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import TimetableCalendarDialog from "@/components/timetable/buttons/timetable-calendar-dialog"

import { singaporeToday } from "./singapore-today"

interface Props {
  calendars: AcademicYearCalendar[]
}

const FEED_PATH = "/calendar.ics"
const FEED_URL = `${siteConfig.url}${FEED_PATH}`

/** "Recess week" and what comes next, for where today falls. */
const describe = (status: Status, calendars: AcademicYearCalendar[]) => {
  const sem = (code: string) =>
    calendars.find((c) => c.semesters[code])?.semesters[code]
  const label = (code: string) => semesterName(code)

  switch (status.kind) {
    case "teaching": {
      const s = sem(status.semester)
      const next =
        s?.recess && status.week <= 7
          ? `recess from ${formatDayShort(s.recess.start)}`
          : s?.revisionAndExams
            ? `revision and exams from ${formatDayShort(s.revisionAndExams.start)}`
            : undefined
      return {
        now: `Teaching Week ${status.week}`,
        next: next && `${label(status.semester)}, ${next}`
      }
    }
    case "recess": {
      const resumes = sem(status.semester)?.teachingWeeks["8"]
      return {
        now: "Recess week",
        next: resumes && `Week 8 starts ${formatDayShort(resumes)}`
      }
    }
    case "exams": {
      const end = sem(status.semester)?.revisionAndExams?.end
      return {
        now: "Revision and exams",
        next: end && `until ${formatDayShort(end)}`
      }
    }
    case "between":
      return {
        now: "Semester break",
        next:
          status.next &&
          `${label(status.next.semester)} starts ${formatDayShort(status.next.start)}`
      }
  }
}

/**
 * One line saying where today falls, and one menu for getting the calendar into
 * a calendar app. "Today" is only known in the browser, so the prerendered HTML
 * shows a placeholder until hydration.
 */
const CalendarStatus = ({ calendars }: Props) => {
  const hydrated = useHydrated()
  const [open, setOpen] = useState(false)
  const text = hydrated
    ? describe(calendarStatus(calendars, singaporeToday()), calendars)
    : null

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
      <div className="min-w-0 text-sm" aria-live="polite">
        {text ? (
          <>
            <span className="text-muted-foreground">This week: </span>
            <span className="font-semibold">{text.now}</span>
            {text.next && (
              <span className="text-muted-foreground">. {text.next}.</span>
            )}
          </>
        ) : (
          <Skeleton className="h-5 w-72" />
        )}
      </div>

      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <CalendarPlus />
        Add to calendar
      </Button>
      <TimetableCalendarDialog
        open={open}
        onOpenChange={setOpen}
        loading={false}
        feedUrl={FEED_URL}
        description="Subscribe to the NTU academic calendar in your calendar app, or download it once."
        whatYouGet="Every teaching week, recess, the revision and exam weeks, public holidays, early finishes and key events, for every year NTU has published. A subscribed calendar updates by itself when NTU changes a date."
        note="Subscribing is better than importing: an imported file does not change when NTU revises the calendar."
        onSubscribe={() => track("academic_calendar_subscribed")}
        onCopied={() => track("academic_calendar_feed_copied")}
        onDownload={() => {
          track("academic_calendar_downloaded")
          const a = document.createElement("a")
          a.href = FEED_PATH
          a.download = "ntu_academic_calendar.ics"
          a.click()
        }}
      />
    </div>
  )
}

export default CalendarStatus
