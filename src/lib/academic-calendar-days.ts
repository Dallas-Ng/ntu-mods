import type {
  AcademicYearCalendar,
  SemesterCalendar
} from "./academic-calendar"
import { addDays, parseLocalDate, toIsoDate } from "./academic-calendar-events"

/**
 * The academic calendar as month grids, the way NTU draws it but with weeks
 * starting on Monday: NTU's teaching weeks run Monday to Friday, so one row is
 * exactly one teaching week (NTU's own Sunday-first grid splits each one).
 */

export type WeekKind = "teaching" | "recess" | "exams"

export interface WeekLabel {
  kind: WeekKind
  /** "1" to "13", "R" for recess, "E" for revision and exams. */
  short: string
  /** "Teaching Week 3", "Recess week", "Revision and exam weeks". */
  long: string
}

export interface DayNote {
  type: "holiday" | "early" | "noClasses" | "event"
  text: string
}

/** Every Monday from Teaching Week 1 to the last exam week, labelled. */
export const semesterWeeks = (
  sem: SemesterCalendar
): (WeekLabel & { monday: string })[] => {
  const first = sem.teachingWeeks["1"]
  if (!first) return []
  const last = sem.revisionAndExams?.end ?? sem.teachingWeeks["13"] ?? first
  const weeks: (WeekLabel & { monday: string })[] = []
  for (
    let monday = parseLocalDate(first);
    toIsoDate(monday) <= last;
    monday = addDays(monday, 7)
  ) {
    const iso = toIsoDate(monday)
    const label = weekLabel(sem, iso)
    if (label) weeks.push({ ...label, monday: iso })
  }
  return weeks
}

/** What kind of week starts on this Monday, if it is in the semester. */
export const weekLabel = (
  sem: SemesterCalendar,
  monday: string
): WeekLabel | undefined => {
  const week = Object.entries(sem.teachingWeeks).find(([, m]) => m === monday)
  if (week)
    return {
      kind: "teaching",
      short: week[0],
      long: `Teaching Week ${week[0]}`
    }
  const friday = toIsoDate(addDays(parseLocalDate(monday), 4))
  if (sem.recess && sem.recess.start <= friday && monday <= sem.recess.end)
    return { kind: "recess", short: "R", long: "Recess week" }
  const exams = sem.revisionAndExams
  if (exams && exams.start <= friday && monday <= exams.end)
    return { kind: "exams", short: "E", long: "Revision and exam weeks" }
  return undefined
}

/** The Monday of the week holding `iso`. */
export const mondayOf = (iso: string) => {
  const date = parseLocalDate(iso)
  return toIsoDate(addDays(date, -((date.getDay() + 6) % 7)))
}

/** What happens on one day: holidays, early dismissals and key events. */
export const dayNotes = (
  calendar: AcademicYearCalendar,
  iso: string
): DayNote[] => {
  const notes: DayNote[] = []
  for (const day of calendar.noClassDays)
    if (day.date === iso)
      notes.push({ type: "holiday", text: `${day.name}: no classes` })
  for (const h of calendar.publicHolidays)
    if (
      h.start <= iso &&
      iso <= h.end &&
      !notes.some((n) => n.text.startsWith(h.name))
    )
      notes.push({ type: "holiday", text: h.name })
  for (const day of calendar.earlyDismissals)
    if (day.date === iso)
      notes.push({
        type: "early",
        text: `${day.name}: classes end at ${day.until}`
      })
  for (const event of calendar.events) {
    if (iso < event.start || iso > event.end) continue
    if (event.noClasses)
      notes.push({
        type: "noClasses",
        text: `${event.name}: no classes ${event.noClasses.from} to ${event.noClasses.to}`
      })
    else
      notes.push({
        type: "event",
        text: event.note ? `${event.name} (${event.note})` : event.name
      })
  }
  return notes
}

export interface MonthGrid {
  year: number
  /** 1 to 12. */
  month: number
  /** Rows of Monday-to-Sunday days; null where the day is in another month. */
  rows: { monday: string; days: (string | null)[] }[]
}

export const monthGrid = (year: number, month: number): MonthGrid => {
  const first = new Date(year, month - 1, 1)
  const rows: MonthGrid["rows"] = []
  for (
    let monday = addDays(first, -((first.getDay() + 6) % 7));
    monday.getMonth() === month - 1 || monday < first;
    monday = addDays(monday, 7)
  ) {
    const days = Array.from({ length: 7 }, (_, i) => {
      const day = addDays(monday, i)
      return day.getMonth() === month - 1 ? toIsoDate(day) : null
    })
    rows.push({ monday: toIsoDate(monday), days })
  }
  return { year, month, rows }
}

/** The months a semester touches, from Teaching Week 1 to the last exam day. */
export const semesterMonths = (sem: SemesterCalendar) => {
  const weeks = semesterWeeks(sem)
  if (weeks.length === 0) return []
  const start = parseLocalDate(weeks[0].monday)
  const end = parseLocalDate(
    sem.revisionAndExams?.end ?? weeks[weeks.length - 1].monday
  )
  const months: MonthGrid[] = []
  for (
    let d = new Date(start.getFullYear(), start.getMonth(), 1);
    d <= end;
    d = new Date(d.getFullYear(), d.getMonth() + 1, 1)
  )
    months.push(monthGrid(d.getFullYear(), d.getMonth() + 1))
  return months
}
