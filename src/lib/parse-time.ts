/**
 * NTU timetables store a slot's time as `HHmm-HHmm` ("0830-0930"). These read
 * that string directly; no date parser is needed for four digits.
 */

/** `0830` -> a Date today at 08:30:00.000, matching the split fields. */
const toDate = (hhmm: string) => {
  const date = new Date()
  date.setHours(Number(hhmm.slice(0, 2)), Number(hhmm.slice(2, 4)), 0, 0)
  return date
}

export const parseTime = (index: Index) => {
  const split = index.time.split("-")
  const startTime = toDate(split[0])
  const endTime = toDate(split[1])
  return { startTime, endTime }
}

/** 1330 -> 810 (minutes since midnight). */
export const hhmmToMinutes = (hhmm: number) =>
  Math.floor(hhmm / 100) * 60 + (hhmm % 100)

export const parseTimeNumber = (index: Index) => {
  const split = index.time.split("-")
  const startTime = parseInt(split[0])
  const endTime = parseInt(split[1])
  return { startTime, endTime }
}
