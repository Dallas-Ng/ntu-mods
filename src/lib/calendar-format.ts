/**
 * Dates for the academic calendar, read from the ISO string itself so the
 * prerendered HTML and the browser agree whatever the visitor's timezone (see
 * formatDate in format.ts).
 */

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
]

const parts = (iso: string) => {
  const [year, month, day] = iso.split("-").map(Number)
  return {
    year,
    month,
    day,
    weekday: new Date(Date.UTC(year, month - 1, day)).getUTCDay()
  }
}

/** "2027-03-01" -> "Mon 1 Mar 2027" */
export const formatDayShort = (iso: string) => {
  const { year, month, day, weekday } = parts(iso)
  return `${DAYS[weekday]} ${day} ${MONTHS[month - 1]} ${year}`
}

/** "2027-03-01" -> "1 Mar" */
export const formatDayMonth = (iso: string) => {
  const { month, day } = parts(iso)
  return `${day} ${MONTHS[month - 1]}`
}

/**
 * A range, dropping what both ends share: "1 to 5 Mar 2027", "28 Sep to 2 Oct
 * 2026", "28 Dec 2026 to 2 Jan 2027". One day is just that day.
 */
export const formatRange = (start: string, end: string) => {
  const a = parts(start)
  const b = parts(end)
  const last = `${b.day} ${MONTHS[b.month - 1]} ${b.year}`
  if (start === end) return last
  if (a.year !== b.year)
    return `${a.day} ${MONTHS[a.month - 1]} ${a.year} to ${last}`
  if (a.month !== b.month) return `${a.day} ${MONTHS[a.month - 1]} to ${last}`
  return `${a.day} to ${last}`
}

/** Weekday name of an ISO date: "Mon". */
export const weekdayShort = (iso: string) => DAYS[parts(iso).weekday]
