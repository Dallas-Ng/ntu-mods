import { C_DATA } from "@/data/consolidated-2023-2"
import { C_INDEXES } from "@/data/consolidated-2023-2-indexes"
import { TRUN_COURSE_CONTENT } from "@/data/truncated-course-content"
import { addDays, format, isBefore, parse, startOfWeek } from "date-fns"
import { EventAttributes, createEvents } from "ics"

import { capitaliseEachWord } from "./capitalise-each-word"
import { formatRemarks, formatTitle } from "./format"

const MIN_DATE = new Date(2024, 0, 15) // Start of AY2023/2024 Semester 2

function parseTime(index: Index) {
  const split = index.time.split("-")
  const startTime = parse(split[0], "HHmm", new Date())
  const endTime = parse(split[1], "HHmm", new Date())
  return { startTime, endTime }
}

export function getIcs(timetable: { [moduleKey: string]: string }) {
  const events: EventAttributes[] = []

  for (const [moduleKey, indexKey] of Object.entries(timetable)) {
    // TODO: FIX C_DATA x TRUNC COURSE CONTENT
    const moduleTitle =
      moduleKey in TRUN_COURSE_CONTENT
        ? TRUN_COURSE_CONTENT[moduleKey]
        : C_DATA[moduleKey].title
    const indexes = C_INDEXES[indexKey]

    for (const index of indexes) {
      const formattedRemarks = formatRemarks(index.remarks)
      const isEven = formattedRemarks === "Even Weeks"
      const isAllWeeks =
        formattedRemarks !== "Even Weeks" && formattedRemarks !== "Odd Weeks"

      const currentDate = new Date()
      let startOfNextWeek = startOfWeek(currentDate, { weekStartsOn: 1 })

      if (isBefore(startOfNextWeek, MIN_DATE)) {
        startOfNextWeek = startOfWeek(MIN_DATE, { weekStartsOn: 1 })
      }

      const { startTime, endTime } = parseTime(index)

      // Calculate start and end dates
      const start = addDays(startOfNextWeek, index.day - 1) // Adjust index.day to start from 0
      start.setHours(startTime.getHours(), startTime.getMinutes())

      const end = addDays(startOfNextWeek, index.day - 1) // Adjust index.day to start from 0
      end.setHours(endTime.getHours(), endTime.getMinutes())

      // Create the recurrence rule
      let recurrenceRule = ""

      if (isAllWeeks) {
        recurrenceRule = `FREQ=WEEKLY;INTERVAL=1;COUNT=14`
      } else if (isEven) {
        recurrenceRule = `FREQ=WEEKLY;BYSETPOS=2;INTERVAL=2;COUNT=7`
      } else {
        recurrenceRule = `FREQ=WEEKLY;BYSETPOS=1;INTERVAL=2;COUNT=7`
      }

      const event: EventAttributes = {
        title: `[${moduleKey}] ${index.type} (${index.group})`,
        start: format(start, "yyyyMMdd'T'HHmmss"),
        end: format(end, "yyyyMMdd'T'HHmmss"),
        description: `${capitaliseEachWord(
          formatTitle(moduleTitle)
        )}\nLocation: ${index.venue}\nRemarks: ${index.remarks}`,
        recurrenceRule: recurrenceRule
      }
      events.push(event)
    }
  }

  return createEvents(events).value
}
