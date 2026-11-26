import { CalendarPlus, ChevronDown, Download, Link } from "lucide-react"
import { toast } from "sonner"

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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"

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

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="sm" variant="outline">
            <CalendarPlus />
            Add to calendar
            <ChevronDown />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72">
          <DropdownMenuItem asChild>
            <a
              href={FEED_URL.replace(/^https?:/, "webcal:")}
              onClick={() => track("academic_calendar_subscribed")}
              className="items-start">
              <CalendarPlus className="mt-0.5" />
              <span>
                Subscribe
                <span className="text-muted-foreground block text-xs">
                  Apple Calendar and Outlook. Updates when NTU changes a date.
                </span>
              </span>
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="items-start"
            onSelect={() => {
              void navigator.clipboard.writeText(FEED_URL).then(
                () => {
                  track("academic_calendar_feed_copied")
                  toast.success("Link copied")
                },
                () => toast.error("Could not copy the link.")
              )
            }}>
            <Link className="mt-0.5" />
            <span>
              Copy feed link
              <span className="text-muted-foreground block text-xs">
                For Google Calendar: Other calendars, then From URL.
              </span>
            </span>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a
              href={FEED_PATH}
              download="ntu_academic_calendar.ics"
              onClick={() => track("academic_calendar_downloaded")}
              className="items-start">
              <Download className="mt-0.5" />
              <span>
                Download .ics
                <span className="text-muted-foreground block text-xs">
                  A one-off copy to import.
                </span>
              </span>
            </a>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default CalendarStatus
