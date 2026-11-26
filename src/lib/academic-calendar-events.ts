import type {
  AcademicYearCalendar,
  SemesterCalendar
} from "./academic-calendar"
import type { IcsEvent } from "./ics"

/**
 * Calendar events built from the academic calendar, shared by the timetable
 * export and the /calendar.ics feed so both use the same UIDs and wording. A
 * calendar app that sees one of these twice updates it in place.
 */

/** "2026-08-10" -> that day at 00:00 local, not UTC. */
export const parseLocalDate = (isoDate: string) => {
  const [year, month, day] = isoDate.split("-").map(Number)
  return new Date(year, month - 1, day)
}

/** The local date as "2026-08-10". */
export const toIsoDate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`

export const addDays = (date: Date, days: number) => {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

/** "14:30" on the same day as `date`. */
export const atTime = (date: Date, hhmm: string) => {
  const [hours, minutes] = hhmm.split(":").map(Number)
  const at = new Date(date)
  at.setHours(hours, minutes, 0, 0)
  return at
}

/** "2026;1" -> "Semester 1". */
export const semesterName = (code: string) => `Semester ${code.split(";")[1]}`

/** First and last day of a semester: Teaching Week 1 to the end of exams. */
export const semesterSpan = (semester: SemesterCalendar) => {
  const weeks = semester.teachingWeeks
  if (!weeks["1"]) return undefined
  const end =
    semester.revisionAndExams?.end ??
    toIsoDate(addDays(parseLocalDate(weeks["13"] ?? weeks["1"]), 6))
  return { start: weeks["1"], end }
}

const allDay = (
  uid: string,
  summary: string,
  start: string,
  end: string,
  description?: string
): IcsEvent => ({
  uid: `${uid}@ntumods.com`,
  summary,
  start: parseLocalDate(start),
  end: parseLocalDate(end),
  allDay: true,
  ...(description && { description })
})

interface Options {
  /** Only this semester ("2026;2"), and only days inside it. */
  semester?: string
  /** One Monday-to-Friday event per teaching week (for the feed). */
  teachingWeeks?: boolean
  /** University key events such as orientation (for the feed). */
  keyEvents?: boolean
}

export const academicCalendarEvents = (
  calendar: AcademicYearCalendar,
  { semester, teachingWeeks = false, keyEvents = false }: Options = {}
): IcsEvent[] => {
  const codes = Object.keys(calendar.semesters).filter(
    (code) => !semester || code === semester
  )
  const spans = codes
    .map((code) => semesterSpan(calendar.semesters[code]))
    .filter((span): span is { start: string; end: string } => !!span)
  // The whole academic year for the feed, only the semester for an export.
  const inScope = (isoDate: string) =>
    !semester || spans.some((s) => s.start <= isoDate && isoDate <= s.end)
  const provisional = calendar.indicative ? " (provisional)" : ""

  const events: IcsEvent[] = []

  for (const code of codes) {
    const sem = calendar.semesters[code]
    const name = semesterName(code)
    if (teachingWeeks) {
      for (const [week, monday] of Object.entries(sem.teachingWeeks)) {
        const friday = toIsoDate(addDays(parseLocalDate(monday), 4))
        events.push(
          allDay(
            `week-${code.replace(";", "-")}-${week}`,
            `${name} Teaching Week ${week}${provisional}`,
            monday,
            friday
          )
        )
      }
    }
    if (sem.recess) {
      const { start, end } = sem.recess
      events.push(
        allDay(`recess-${start}`, `Recess week${provisional}`, start, end)
      )
    }
    if (sem.revisionAndExams) {
      const { start, end } = sem.revisionAndExams
      events.push(
        allDay(
          `exams-${start}`,
          `Revision and exam weeks${provisional}`,
          start,
          end
        )
      )
    }
  }

  for (const day of calendar.noClassDays) {
    if (!inScope(day.date)) continue
    events.push(
      allDay(
        `no-classes-${day.date}`,
        `${day.name}: no classes`,
        day.date,
        day.date
      )
    )
  }

  for (const day of calendar.earlyDismissals) {
    if (!inScope(day.date)) continue
    events.push(
      allDay(
        `early-${day.date}`,
        `${day.name}: classes end at ${day.until}`,
        day.date,
        day.date
      )
    )
  }

  for (const event of calendar.events) {
    if (event.noClasses && inScope(event.start)) {
      const date = parseLocalDate(event.start)
      events.push({
        uid: `no-classes-${event.start}-${event.noClasses.from}@ntumods.com`,
        summary: `${event.name}: no classes`,
        start: atTime(date, event.noClasses.from),
        end: atTime(date, event.noClasses.to),
        ...(event.note && { description: event.note })
      })
    } else if (keyEvents && !event.noClasses) {
      events.push(
        allDay(
          `event-${event.start}-${event.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
          `${event.name}${provisional}`,
          event.start,
          event.end,
          event.note
        )
      )
    }
  }

  return events
}

export type CalendarStatus =
  | { kind: "teaching"; semester: string; week: number }
  | { kind: "recess"; semester: string }
  | { kind: "exams"; semester: string }
  | { kind: "between"; next?: { semester: string; start: string } }

/** Where `today` ("2027-01-20") falls in the published calendars. */
export const calendarStatus = (
  calendars: AcademicYearCalendar[],
  today: string
): CalendarStatus => {
  const semesters = calendars
    .flatMap((c) => Object.entries(c.semesters))
    .sort(([a], [b]) => a.localeCompare(b))

  for (const [code, sem] of semesters) {
    const span = semesterSpan(sem)
    if (!span || today < span.start || today > span.end) continue
    if (
      sem.recess &&
      sem.recess.start <= today &&
      today <= addWeekend(sem.recess.end)
    )
      return { kind: "recess", semester: code }
    if (sem.revisionAndExams && today >= sem.revisionAndExams.start)
      return { kind: "exams", semester: code }
    // The latest teaching week that has started; weekends belong to it.
    const week = Object.entries(sem.teachingWeeks)
      .filter(([, monday]) => monday <= today)
      .map(([n]) => Number(n))
      .sort((a, b) => b - a)[0]
    if (week) return { kind: "teaching", semester: code, week }
  }

  const next = semesters
    .map(([code, sem]) => ({ semester: code, start: sem.teachingWeeks["1"] }))
    .find(({ start }) => start && start > today)
  return { kind: "between", ...(next && { next }) }
}

/** A Friday's weekend still belongs to that week. */
const addWeekend = (friday: string) =>
  toIsoDate(addDays(parseLocalDate(friday), 2))
