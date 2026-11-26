import { CalendarPlus, Download } from "lucide-react"

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
import { buttonVariants } from "@/components/ui/button"
import { cardVariants } from "@/components/ui/card"
import { CopyButton } from "@/components/ui/copy-button"
import { Skeleton } from "@/components/ui/skeleton"

interface Props {
  calendars: AcademicYearCalendar[]
}

const FEED_PATH = "/calendar.ics"
const FEED_URL = `${siteConfig.url}${FEED_PATH}`

/** Today in Singapore, whatever the visitor's timezone: "2027-01-20". */
const singaporeToday = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Singapore",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date())

const semesterLabel = (code: string) =>
  `AY${code.split(";")[0]} ${semesterName(code)}`

/** The headline and the line under it for where today falls. */
const describe = (status: Status, calendars: AcademicYearCalendar[]) => {
  const semester = (code: string) =>
    calendars.find((c) => c.semesters[code])?.semesters[code]

  switch (status.kind) {
    case "teaching": {
      const sem = semester(status.semester)
      const next =
        sem?.recess && status.week <= 7
          ? `Recess week starts ${formatDayShort(sem.recess.start)}.`
          : sem?.revisionAndExams
            ? `Revision and exam weeks start ${formatDayShort(sem.revisionAndExams.start)}.`
            : ""
      return {
        title: `Teaching Week ${status.week}`,
        detail: `${semesterLabel(status.semester)}. ${next}`.trim()
      }
    }
    case "recess": {
      const resumes = semester(status.semester)?.teachingWeeks["8"]
      return {
        title: "Recess week",
        detail: resumes
          ? `${semesterLabel(status.semester)}. Teaching Week 8 starts ${formatDayShort(resumes)}.`
          : semesterLabel(status.semester)
      }
    }
    case "exams": {
      const end = semester(status.semester)?.revisionAndExams?.end
      return {
        title: "Revision and exam weeks",
        detail: end
          ? `${semesterLabel(status.semester)}. The exam period ends ${formatDayShort(end)}.`
          : semesterLabel(status.semester)
      }
    }
    case "between":
      return {
        title: "Semester break",
        detail: status.next
          ? `${semesterLabel(status.next.semester)} starts ${formatDayShort(status.next.start)}.`
          : "NTU has not published the next academic calendar yet."
      }
  }
}

/**
 * Where today falls in the NTU calendar, and the feed to subscribe to. "Today"
 * is only known in the browser, so the prerendered HTML shows a placeholder and
 * the status fills in after hydration.
 */
const CalendarStatus = ({ calendars }: Props) => {
  const hydrated = useHydrated()
  const text = hydrated
    ? describe(calendarStatus(calendars, singaporeToday()), calendars)
    : null

  return (
    <section
      aria-labelledby="calendar-now"
      className={cardVariants({ className: "space-y-4 p-5 sm:p-6" })}>
      <div className="min-w-0 space-y-1" aria-live="polite">
        <p className="text-muted-foreground text-sm">This week at NTU</p>
        {text ? (
          <>
            <p id="calendar-now" className="text-xl font-bold tracking-tight">
              {text.title}
            </p>
            <p className="text-muted-foreground text-sm text-pretty">
              {text.detail}
            </p>
          </>
        ) : (
          <>
            <p id="calendar-now" className="sr-only">
              Loading this week
            </p>
            <Skeleton className="h-7 w-44" />
            <Skeleton className="h-5 w-64" />
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <a
          href={FEED_URL.replace(/^https?:/, "webcal:")}
          onClick={() => track("academic_calendar_subscribed")}
          className={buttonVariants({ size: "sm" })}>
          <CalendarPlus />
          Subscribe
        </a>
        <a
          href={FEED_PATH}
          download="ntu_academic_calendar.ics"
          onClick={() => track("academic_calendar_downloaded")}
          className={buttonVariants({ size: "sm", variant: "outline" })}>
          <Download />
          Download .ics
        </a>
        <CopyButton
          value={FEED_URL}
          label
          variant="ghost"
          size="sm"
          onCopied={() => track("academic_calendar_feed_copied")}
        />
      </div>
      <p className="text-muted-foreground text-xs text-pretty">
        Subscribing keeps your calendar app up to date when NTU changes a date.
        For Google Calendar, copy the link, then choose Other calendars and From
        URL.
      </p>
    </section>
  )
}

export default CalendarStatus
