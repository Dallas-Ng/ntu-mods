import { addDays, differenceInWeeks, format, startOfWeek } from "date-fns"
import { createEvents, EventAttributes } from "ics"

import { formatRemarks } from "./format"
import { getIndex } from "./get-index"
import { getModule } from "./get-module"
import { parseTime } from "./parse-time"

const MIN_DATE = new Date("2024-08-12") // Start of AY24/25 Semester 1

export const getIcs = (timetable: { [moduleKey: string]: string }) => {
  const events: EventAttributes[] = []

  for (const [moduleKey, indexKey] of Object.entries(timetable)) {
    const moduleData = getModule(moduleKey)
    const indexes = getIndex(indexKey)

    for (const index of indexes) {
      const formattedRemarks = formatRemarks(index.remarks)
      const isEven = formattedRemarks === "Even Weeks"
      const isOdd = formattedRemarks === "Odd Weeks"
      const isAllWeeks = !isEven && !isOdd

      let startingWeek = startOfWeek(MIN_DATE, { weekStartsOn: 1 })

      const { startTime, endTime } = parseTime(index)

      // Calculate start and end dates
      const start = addDays(startingWeek, index.day - 1) // Adjust index.day to start from 0
      start.setHours(startTime.getHours(), startTime.getMinutes())

      const end = addDays(startingWeek, index.day - 1) // Adjust index.day to start from 0
      end.setHours(endTime.getHours(), endTime.getMinutes())

      // Calculate the number of occurrences
      const totalWeeks = 13 // The schedule lasts for 13 weeks

      // Map day numbers to iCalendar day abbreviations
      const dayAbbreviations = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"]
      const dayAbbreviation = dayAbbreviations[start.getDay()]

      // Adjust start date for even weeks
      if (isEven && differenceInWeeks(start, MIN_DATE) % 2 === 0) {
        start.setDate(start.getDate() + 7)
        end.setDate(end.getDate() + 7)
      }

      // Adjust start date for odd weeks
      if (isOdd && differenceInWeeks(start, MIN_DATE) % 2 !== 0) {
        start.setDate(start.getDate() + 7)
        end.setDate(end.getDate() + 7)
      }

      // Create the recurrence rule
      let recurrenceRule = ``
      if (isAllWeeks) {
        recurrenceRule = `FREQ=WEEKLY;COUNT=${totalWeeks}`
      } else if (isEven) {
        recurrenceRule = `FREQ=WEEKLY;INTERVAL=2;COUNT=${Math.floor((totalWeeks + 1) / 2)};BYDAY=${dayAbbreviation}`
      } else if (isOdd) {
        recurrenceRule = `FREQ=WEEKLY;INTERVAL=2;COUNT=${Math.ceil(totalWeeks / 2)};BYDAY=${dayAbbreviation}`
      }

      const event: EventAttributes = {
        title: `[${moduleKey}] ${index.type} (${index.group})`,
        start: format(start, "yyyyMMdd'T'HHmmss"),
        end: format(end, "yyyyMMdd'T'HHmmss"),
        description: `${moduleData.title}\nLocation: ${index.venue}\nRemarks: ${index.remarks}`,
        recurrenceRule: recurrenceRule
      }
      events.push(event)
    }
  }

  return createEvents(events).value
}
