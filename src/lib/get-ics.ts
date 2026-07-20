import { addDays, format, startOfWeek } from "date-fns"
import { createEvents, EventAttributes } from "ics"

import { parseTime } from "./parse-time"

const MIN_DATE = new Date("2026-08-10") // Start of AY26/27 Semester 1
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

/**
 * Generate an ICS calendar from a timetable.
 * @param timetable - { moduleCode: indexKey }
 * @param indexLookup - flat map of indexKey -> Index slots (built from semester indexes file)
 * @param titleLookup - map of moduleCode -> title (optional, for event descriptions)
 */
export const getIcs = (
  timetable: { [moduleKey: string]: string },
  indexLookup: Record<string, Index[]>,
  titleLookup: Record<string, string> = {}
) => {
  const events: EventAttributes[] = []

  for (const [moduleKey, indexKey] of Object.entries(timetable)) {
    const indexes = indexLookup[indexKey] ?? []
    const title = titleLookup[moduleKey] ?? moduleKey

    for (const index of indexes) {
      const { startTime, endTime } = parseTime(index)
      const teachingWeeks = parseTeachingWeeks(index.remarks)

      for (const weekNumber of teachingWeeks) {
        const weekMonday = teachingWeekMonday(weekNumber)

        const start = addDays(weekMonday, index.day - 1)
        start.setHours(startTime.getHours(), startTime.getMinutes())

        const end = addDays(weekMonday, index.day - 1)
        end.setHours(endTime.getHours(), endTime.getMinutes())

        events.push({
          title: `[${moduleKey}] ${index.type} (${index.group})`,
          start: format(start, "yyyyMMdd'T'HHmmss"),
          end: format(end, "yyyyMMdd'T'HHmmss"),
          description: `${title}\nLocation: ${index.venue}\nRemarks: ${index.remarks}`
        })
      }
    }
  }

  return createEvents(events).value
}
