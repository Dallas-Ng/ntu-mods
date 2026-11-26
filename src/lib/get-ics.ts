import {
  getAcademicYearCalendar,
  getSemesterCalendar
} from "./academic-calendar"
import {
  academicCalendarEvents,
  addDays,
  atTime,
  parseLocalDate,
  semesterSpan,
  toIsoDate
} from "./academic-calendar-events"
import { createIcs, type IcsEvent } from "./ics"
import { parseTime } from "./parse-time"
import { latestSemester, latestYear } from "./semesters"
import { parseTeachingWeeks } from "./teaching-weeks"

const SEMESTER_CODE = `${latestYear};${latestSemester}`

// From the official NTU academic calendar PDF (scraper/academic_calendar.py).
// Missing for a semester NTU has no calendar for, such as a special term.
const SEMESTER_CALENDAR = getSemesterCalendar(SEMESTER_CODE)
const YEAR_CALENDAR = getAcademicYearCalendar(SEMESTER_CODE)

/** The Monday of the week containing `date`. */
const startOfWeek = (date: Date) => {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  return monday
}

// Without a published calendar, assume the usual shape: Recess Week falls
// between Teaching Week 7 and Teaching Week 8, so weeks 8-13 shift back by
// one extra week.
const FALLBACK_WEEK_1_MONDAY = startOfWeek(parseLocalDate("2026-08-10"))
const RECESS_AFTER_WEEK = 7

const teachingWeekMonday = (weekNumber: number) => {
  const published = SEMESTER_CALENDAR?.teachingWeeks[String(weekNumber)]
  if (published) return parseLocalDate(published)
  const calendarWeekOffset =
    weekNumber <= RECESS_AFTER_WEEK ? weekNumber - 1 : weekNumber
  return addDays(FALLBACK_WEEK_1_MONDAY, calendarWeekOffset * 7)
}

const SPAN = SEMESTER_CALENDAR && semesterSpan(SEMESTER_CALENDAR)
const inSemester = (isoDate: string) =>
  !!SPAN && SPAN.start <= isoDate && isoDate <= SPAN.end

/** Holidays and replacement holidays in this semester: no classes all day. */
const NO_CLASS_DAYS = new Map(
  (YEAR_CALENDAR?.noClassDays ?? [])
    .filter((day) => inSemester(day.date))
    .map((day) => [day.date, day.name])
)

/** Eves of some holidays: classes end early. */
const EARLY_DISMISSALS = new Map(
  (YEAR_CALENDAR?.earlyDismissals ?? [])
    .filter((day) => inSemester(day.date))
    .map((day) => [day.date, day])
)

/** Events with a no-class window, e.g. Students' Union Day 10:30 to 14:30. */
const NO_CLASS_WINDOWS = (YEAR_CALENDAR?.events ?? []).filter(
  (event) => event.noClasses && inSemester(event.start)
)

/**
 * Why a class on this day does not run, or undefined if it does. Only NTU
 * classes are affected, never a student's own custom blocks.
 */
const cancelledBecause = (start: Date, end: Date) => {
  const day = toIsoDate(start)
  const holiday = NO_CLASS_DAYS.get(day)
  if (holiday) return holiday

  const early = EARLY_DISMISSALS.get(day)
  if (early && start >= atTime(start, early.until)) return early.name

  for (const event of NO_CLASS_WINDOWS) {
    if (event.start > day || day > event.end || !event.noClasses) continue
    const from = atTime(start, event.noClasses.from)
    const to = atTime(start, event.noClasses.to)
    if (start < to && end > from) return event.name
  }
  return undefined
}

/**
 * All-day events that frame the semester: holidays, recess week, and the
 * revision and exam weeks. Same UIDs as the /calendar.ics feed.
 */
const calendarEvents = (): IcsEvent[] =>
  YEAR_CALENDAR
    ? academicCalendarEvents(YEAR_CALENDAR, { semester: SEMESTER_CODE })
    : []

/** Which block fields the user has chosen to show, mirrors Settings.tableCell. */
export interface IcsTableCellSettings {
  type: boolean
  group: boolean
  remarks: boolean
  key: boolean
}

const DEFAULT_TABLE_CELL: IcsTableCellSettings = {
  type: true,
  group: true,
  remarks: true,
  key: false
}

/**
 * Stable UID per module/index/week. Calendar apps read the same UID as the same
 * event, so re-exporting a timetable updates events in place instead of
 * duplicating them. Anything outside the RFC 5545 URI-safe set becomes a dash.
 */
const eventUid = (moduleKey: string, indexKey: string, weekNumber: number) =>
  `${moduleKey}-${indexKey}-w${weekNumber}@ntumods.com`.replace(
    /[^A-Za-z0-9.@_-]/g,
    "-"
  )

/**
 * Generate an ICS calendar from a timetable.
 *
 * @param timetable - { moduleKey: indexKey } — moduleKey covers both real
 *   modules (code) and custom blocks (customCourseModuleKey), mirroring
 *   whatever indexLookup/labelLookup are keyed with
 * @param indexLookup - Flat map of indexKey -> Index slots
 * @param titleLookup - Map of moduleKey -> full title/name shown in the event
 *   description
 * @param tableCell - Which fields the user has toggled on for their timetable
 *   blocks; mirrors that same choice into the exported event's
 *   title/description
 * @param labelLookup - Map of moduleKey -> short label shown in the event
 *   title's brackets; defaults to moduleKey itself (correct for real module
 *   codes)
 * @param moduleRemarks - Map of moduleKey -> user's personal note, applies to
 *   every index of that module unless overridden by indexRemarks
 * @param indexRemarks - Map of "moduleKey:indexKey" -> user's personal note for
 *   that specific index, takes priority over moduleRemarks
 */
export const getIcs = (
  timetable: { [moduleKey: string]: string },
  indexLookup: Record<string, Index[]>,
  titleLookup: Record<string, string> = {},
  tableCell: IcsTableCellSettings = DEFAULT_TABLE_CELL,
  labelLookup: Record<string, string> = {},
  moduleRemarks: Record<string, string> = {},
  indexRemarks: Record<string, string> = {}
) => {
  const events: IcsEvent[] = []
  let scheduled = false

  for (const [moduleKey, indexKey] of Object.entries(timetable)) {
    const indexes = indexLookup[indexKey] ?? []
    const title = titleLookup[moduleKey] ?? moduleKey
    const label = labelLookup[moduleKey] ?? moduleKey
    const note =
      indexRemarks[`${moduleKey}:${indexKey}`] || moduleRemarks[moduleKey]

    for (const index of indexes) {
      // day 0 (or unset) means "online / no fixed timeslot" — there's no
      // real slot to schedule, so it can't become a calendar event.
      if (!index.day) continue

      const { startTime, endTime } = parseTime(index)
      const teachingWeeks = parseTeachingWeeks(index.remarks)

      // Custom blocks store their free-text type label (e.g. "Gym") in
      // remarks, since `type` is only a preset fallback used for colouring —
      // showing `type` here would misrepresent it as a real LEC/TUT/etc.
      const typeLabel = index.isCustom ? index.remarks : index.type

      for (const weekNumber of teachingWeeks) {
        const weekMonday = teachingWeekMonday(weekNumber)

        const start = addDays(weekMonday, index.day - 1)
        start.setHours(startTime.getHours(), startTime.getMinutes())

        const end = addDays(weekMonday, index.day - 1)
        end.setHours(endTime.getHours(), endTime.getMinutes())

        scheduled = true
        // No class on a public holiday, after an early dismissal, or in a
        // no-class window; the day itself is exported as its own event.
        if (!index.isCustom && cancelledBecause(start, end)) continue
        const early = index.isCustom
          ? undefined
          : EARLY_DISMISSALS.get(toIsoDate(start))
        const endsEarly = early && end > atTime(start, early.until)

        const eventTitle = [
          `[${label}]`,
          tableCell.type && typeLabel,
          // group mirrors the custom block's own name — already the bracket
          // label, so showing it again would just repeat it
          !index.isCustom && tableCell.group && `(${index.group})`
        ]
          .filter(Boolean)
          .join(" ")

        const description = [
          title,
          // for custom blocks remarks already surfaced as typeLabel above
          !index.isCustom &&
            tableCell.remarks &&
            index.remarks &&
            `Remarks: ${index.remarks}`,
          tableCell.key && `Key: ${index.key}`,
          note && `Note: ${note}`,
          endsEarly && `${early.name}: classes end at ${early.until}.`
        ]
          .filter(Boolean)
          .join("\n")

        events.push({
          uid: eventUid(moduleKey, index.key, weekNumber),
          summary: eventTitle,
          start,
          end,
          location: index.venue,
          description
        })
      }
    }
  }

  // Only frame the semester when there is a class to frame.
  if (scheduled) events.push(...calendarEvents())

  return createIcs(events)
}
