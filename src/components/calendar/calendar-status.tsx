import { CalendarPlus, Download } from "lucide-react"

import { siteConfig } from "@/config/site"
import { useHydrated } from "@/hooks/use-hydrated"
import type { AcademicYearCalendar } from "@/lib/academic-calendar"
import { mondayOf, semesterWeeks } from "@/lib/academic-calendar-days"
import {
  addDays,
  calendarStatus,
  parseLocalDate,
  semesterName,
  toIsoDate,
  type CalendarStatus as Status
} from "@/lib/academic-calendar-events"
import { track } from "@/lib/analytics"
import { formatDayShort } from "@/lib/calendar-format"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { cardVariants } from "@/components/ui/card"
import { CopyButton } from "@/components/ui/copy-button"
import { Skeleton } from "@/components/ui/skeleton"

import { WEEK_FILL } from "./calendar-months"
import { singaporeToday } from "./singapore-today"

interface Props {
  calendars: AcademicYearCalendar[]
}

const FEED_PATH = "/calendar.ics"
const FEED_URL = `${siteConfig.url}${FEED_PATH}`

const semesterLabel = (code: string) =>
  `AY${code.split(";")[0]} ${semesterName(code)}`

const findSemester = (calendars: AcademicYearCalendar[], code: string) =>
  calendars.find((c) => c.semesters[code])

/** The headline and the line under it for where today falls. */
const describe = (status: Status, calendars: AcademicYearCalendar[]) => {
  const semester = (code: string) =>
    findSemester(calendars, code)?.semesters[code]

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

/** One block per week of the semester, today's week outlined. */
const SemesterStrip = ({
  calendar,
  code,
  today
}: {
  calendar: AcademicYearCalendar
  code: string
  today: string
}) => {
  const weeks = semesterWeeks(calendar.semesters[code])
  const noClassWeekdays = new Set(
    calendar.noClassDays
      .map((d) => d.date)
      .filter((d) => parseLocalDate(d).getDay() % 6 !== 0)
  )
  const thisWeek = mondayOf(today)

  return (
    <div className="space-y-1.5">
      <ol
        aria-label={`${semesterLabel(code)}, week by week`}
        className="flex gap-0.5">
        {weeks.map((w) => {
          const days = Array.from({ length: 5 }, (_, i) =>
            toIsoDate(addDays(parseLocalDate(w.monday), i))
          )
          const holiday = days.some((d) => noClassWeekdays.has(d))
          const current = w.monday === thisWeek
          const past = w.monday < thisWeek
          return (
            <li
              key={w.monday}
              aria-current={current ? "date" : undefined}
              aria-label={`${w.long}, from ${formatDayShort(w.monday)}${holiday ? ", has a day with no classes" : ""}${current ? ", this week" : ""}`}
              className={cn(
                "relative flex h-8 min-w-0 flex-1 items-center justify-center rounded-sm text-xs tabular-nums",
                WEEK_FILL[w.kind],
                past && !current && "text-muted-foreground",
                current && "ring-foreground font-semibold ring-2 ring-inset"
              )}>
              {w.short}
              {holiday && (
                <span
                  aria-hidden
                  className="bg-destructive absolute bottom-1 left-1/2 size-1 -translate-x-1/2 rounded-full"
                />
              )}
            </li>
          )
        })}
      </ol>
      <div className="text-muted-foreground flex justify-between text-xs tabular-nums">
        <span>{formatDayShort(weeks[0]?.monday ?? "")}</span>
        <span>
          {formatDayShort(
            calendar.semesters[code].revisionAndExams?.end ??
              weeks[weeks.length - 1]?.monday ??
              ""
          )}
        </span>
      </div>
    </div>
  )
}

/**
 * Where today falls in the NTU calendar, the semester at a glance, and the feed
 * to subscribe to. "Today" is only known in the browser, so the prerendered
 * HTML shows a placeholder and the status fills in after hydration.
 */
const CalendarStatus = ({ calendars }: Props) => {
  const hydrated = useHydrated()
  const today = hydrated ? singaporeToday() : undefined
  const status = today ? calendarStatus(calendars, today) : undefined
  const text = status ? describe(status, calendars) : null
  const stripCode =
    status?.kind === "between" ? status.next?.semester : status?.semester
  const stripCalendar = stripCode
    ? findSemester(calendars, stripCode)
    : undefined

  return (
    <section
      aria-labelledby="calendar-now"
      className={cardVariants({ className: "space-y-5 p-5 sm:p-6" })}>
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

      {!today ? (
        <Skeleton className="h-12 w-full" />
      ) : (
        stripCode &&
        stripCalendar && (
          <SemesterStrip
            calendar={stripCalendar}
            code={stripCode}
            today={today}
          />
        )
      )}

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
