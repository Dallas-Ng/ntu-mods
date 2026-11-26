import CALENDAR_JSON from "@/data/api/calendar.json"

/**
 * NTU's academic calendar, read from the official semester calendar PDF by
 * scraper/academic_calendar.py. Keyed by academic year ("2026" = AY2026-27).
 * Dates are ISO "YYYY-MM-DD" in Singapore time.
 */

export interface DateRange {
  start: string
  end: string
}

export interface SemesterCalendar {
  /** Teaching week number ("1"-"13") -> the Monday it starts. */
  teachingWeeks: Record<string, string>
  recess?: DateRange
  revisionAndExams?: DateRange
}

export interface CalendarDay {
  date: string
  name: string
}

export interface EarlyDismissal extends CalendarDay {
  /** "14:30": classes end at this time. */
  until: string
}

export interface CalendarEvent extends DateRange {
  name: string
  note?: string
  /** A window with no undergraduate classes, e.g. Students' Union Day. */
  noClasses?: { from: string; to: string }
}

export interface AcademicYearCalendar {
  academicYear: number
  indicative: boolean
  source?: string
  semesters: Record<string, SemesterCalendar>
  /** Holidays and replacement holidays: no classes all day. */
  noClassDays: CalendarDay[]
  earlyDismissals: EarlyDismissal[]
  publicHolidays: (DateRange & { name: string; note?: string })[]
  events: CalendarEvent[]
}

const CALENDAR = CALENDAR_JSON as Record<string, AcademicYearCalendar>

/** "2026;2" -> the calendar of AY2026-27, or undefined if not published. */
export const getAcademicYearCalendar = (semesterCode: string) =>
  CALENDAR[semesterCode.split(";")[0]]

/** The semester's teaching weeks, recess and exams, if NTU has published them. */
export const getSemesterCalendar = (semesterCode: string) =>
  getAcademicYearCalendar(semesterCode)?.semesters[semesterCode]

/** Every published academic year, oldest first. */
export const getAllAcademicYearCalendars = () =>
  Object.keys(CALENDAR)
    .sort()
    .map((year) => CALENDAR[year])
