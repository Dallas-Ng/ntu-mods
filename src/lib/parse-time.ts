import { parse } from "date-fns"

export const parseTime = (index: Index) => {
  const split = index.time.split("-")
  const startTime = parse(split[0], "HHmm", new Date())
  const endTime = parse(split[1], "HHmm", new Date())
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
