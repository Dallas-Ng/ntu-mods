// Teaching Week 1 start (a Monday) per semester, from the official NTU
// academic calendar, keyed "YYYY;S". Add a line when a new semester's data
// ships: the prebuild (scripts/build-static-data.mts) fails if the latest
// semester has no entry, and getIcs throws rather than guess a date.
export const WEEK_1_START: Record<string, string> = {
  "2026;1": "2026-08-10",
  "2026;2": "2027-01-11"
}

export const hasWeek1Start = (semKey: string) => semKey in WEEK_1_START

export const week1Start = (semKey: string) => {
  const start = WEEK_1_START[semKey]
  if (!start) {
    throw new Error(
      `No Teaching Week 1 date for semester ${semKey}: add it to src/config/semester-calendar.ts`
    )
  }
  return start
}
