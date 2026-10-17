import { addDays, format, startOfWeek } from "date-fns"
import { createEvents, EventAttributes } from "ics"

import { parseTime } from "./parse-time"
import { latestSemester, latestYear } from "./semesters"

// Teaching Week 1 start per semester, from the official NTU academic calendar.
// Add a line when a new semester's data ships.
const WEEK_1_START: Record<string, string> = {
  "2026;1": "2026-08-10",
  "2026;2": "2027-01-11"
}
const MIN_DATE = new Date(
  WEEK_1_START[`${latestYear};${latestSemester}`] ?? "2026-08-10"
)
const WEEK_1_MONDAY = startOfWeek(MIN_DATE, { weekStartsOn: 1 })

const TOTAL_TEACHING_WEEKS = 13
// Recess Week always falls between Teaching Week 7 and Teaching Week 8,
// so calendar dates for weeks 8-13 are shifted back by one extra week.
const RECESS_AFTER_WEEK = 7

const range = (start: number, end: number) =>
  Array.from({ length: end - start + 1 }, (_, i) => start + i)

/**
 * Parse a remarks string (e.g. "Teaching Wk1,3-13") into the list of
 * teaching week numbers (1-13) an index slot actually runs on.
 */
const parseTeachingWeeks = (remarks: string): number[] => {
  if (remarks === "") return range(1, TOTAL_TEACHING_WEEKS)
  if (remarks === "Not conducted during Teaching Weeks") return []

  const match = remarks.match(/^Teaching Wk(.+)$/)
  if (!match) return range(1, TOTAL_TEACHING_WEEKS)

  const weeks = new Set<number>()
  for (const token of match[1].split(",")) {
    const [start, end] = token.split("-").map(Number)
    for (let week = start; week <= (end ?? start); week++) weeks.add(week)
  }
  return [...weeks].sort((a, b) => a - b)
}

const teachingWeekMonday = (weekNumber: number) => {
  const calendarWeekOffset =
    weekNumber <= RECESS_AFTER_WEEK ? weekNumber - 1 : weekNumber
  return addDays(WEEK_1_MONDAY, calendarWeekOffset * 7)
}

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
 * Generate an ICS calendar from a timetable.
 * @param timetable - { moduleKey: indexKey } — moduleKey covers both real
 *   modules (code) and custom blocks (customCourseModuleKey), mirroring
 *   whatever indexLookup/labelLookup are keyed with
 * @param indexLookup - flat map of indexKey -> Index slots
 * @param titleLookup - map of moduleKey -> full title/name shown in the event description
 * @param tableCell - which fields the user has toggled on for their timetable blocks;
 *   mirrors that same choice into the exported event's title/description
 * @param labelLookup - map of moduleKey -> short label shown in the event title's
 *   brackets; defaults to moduleKey itself (correct for real module codes)
 * @param moduleRemarks - map of moduleKey -> user's personal note, applies to every
 *   index of that module unless overridden by indexRemarks
 * @param indexRemarks - map of "moduleKey:indexKey" -> user's personal note for that
 *   specific index, takes priority over moduleRemarks
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
  const events: EventAttributes[] = []

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
          note && `Note: ${note}`
        ]
          .filter(Boolean)
          .join("\n")

        events.push({
          title: eventTitle,
          start: format(start, "yyyyMMdd'T'HHmmss"),
          end: format(end, "yyyyMMdd'T'HHmmss"),
          location: index.venue,
          description
        })
      }
    }
  }

  return createEvents(events).value
}
