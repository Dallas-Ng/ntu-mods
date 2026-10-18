export const formatTitle = (courseTitle: string) => {
  return courseTitle.replace(/[^a-zA-Z ]/g, "").replace(/\s+/g, " ")
}

export function formatHhmm(hhmm: number): string {
  const h = Math.floor(hhmm / 100)
  const m = hhmm % 100
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

export const formatRemarks = (remarks: string) => {
  let formattedRemarks = remarks

  if (remarks.includes("2,4,6")) {
    formattedRemarks = "Even Weeks"
  } else if (remarks.includes("1,3,5")) {
    formattedRemarks = "Odd Weeks"
  } else if (remarks.includes("Teaching")) {
    formattedRemarks = formattedRemarks.replace("Teaching", "")
  }

  return formattedRemarks
}

/** 1138 -> "1,138". Fixed locale so builds do not depend on the host. */
export const formatCount = (n: number) => n.toLocaleString("en-US")

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
]

/**
 * Reads the YYYY-MM-DD prefix as written rather than through Date, so the
 * prerendered HTML and the browser agree whatever the visitor's timezone or
 * ICU build (toLocaleDateString shifted the day west of UTC and spells
 * September "Sept" or "Sep" depending on the engine). Anything else is
 * returned unchanged.
 */
const formatDate = (date: string, short: boolean) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date)
  const month = match && MONTHS[Number(match[2]) - 1]
  if (!month) return date
  return `${Number(match[3])} ${short ? month.slice(0, 3) : month} ${match[1]}`
}

/** "2026-09-03" -> "3 Sep 2026" */
export const formatShortDate = (date: string) => formatDate(date, true)

/** "2026-09-03" -> "3 September 2026" */
export const formatLongDate = (date: string) => formatDate(date, false)
