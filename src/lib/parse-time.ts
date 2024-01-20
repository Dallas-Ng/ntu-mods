import { parse } from "date-fns"

export const parseTime = (index: Index) => {
  const split = index.time.split("-")
  const startTime = parse(split[0], "HHmm", new Date())
  const endTime = parse(split[1], "HHmm", new Date())
  return { startTime, endTime }
}

export const parseTimeNumber = (index: Index) => {
  const split = index.time.split("-")
  const startTime = parseInt(split[0])
  const endTime = parseInt(split[1])
  return { startTime, endTime }
}
