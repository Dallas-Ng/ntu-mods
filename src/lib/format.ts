const TITLE_CHARS = /[^a-zA-Z ]/g // e.g. "Maths 2!" -> "2" and "!"
const WHITESPACE = /\s+/g // e.g. "A  B" -> "  "
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})/ // e.g. "2026-11-03"
const DISPLAY_DATE = /^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/ // e.g. "23 November 2026"

export const formatTitle = (courseTitle: string) => {
  return courseTitle.replace(TITLE_CHARS, "").replace(WHITESPACE, " ")
}

/** Letters before the digits in a module code ("CZ1001" -> "CZ"); "#" if none. */
export const getModulePrefix = (code: string) =>
  code.match(/^[A-Z]+/)?.[0] ?? "#"

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
 * prerendered HTML and the browser agree whatever the visitor's timezone or ICU
 * build (toLocaleDateString shifted the day west of UTC and spells September
 * "Sept" or "Sep" depending on the engine). Anything else is returned
 * unchanged.
 */
const formatDate = (date: string, short: boolean) => {
  const match = ISO_DATE.exec(date)
  const month = match && MONTHS[Number(match[2]) - 1]
  if (!month) return date
  return `${Number(match[3])} ${short ? month.slice(0, 3) : month} ${match[1]}`
}

/** "2026-09-03" -> "3 Sep 2026" */
export const formatShortDate = (date: string) => formatDate(date, true)

/** "2026-09-03" -> "3 September 2026" */
export const formatLongDate = (date: string) => formatDate(date, false)

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday"
]

const MONTH_INDEX = new Map<string, number>(
  MONTHS.flatMap((name, i) => [
    [name.toLowerCase(), i],
    [name.slice(0, 3).toLowerCase(), i]
  ])
)

const parseDisplayDateParts = (dateStr: string) => {
  const match = DISPLAY_DATE.exec(dateStr.trim())
  if (!match) return null
  const day = Number(match[1])
  const monthIdx = MONTH_INDEX.get(match[2].toLowerCase())
  const year = Number(match[3])
  if (monthIdx === undefined) return null
  const ms = Date.UTC(year, monthIdx, day)
  const d = new Date(ms)
  if (
    d.getUTCFullYear() !== year ||
    d.getUTCMonth() !== monthIdx ||
    d.getUTCDate() !== day
  ) {
    return null
  }
  return { day, monthIdx, year, ms, weekday: WEEKDAYS[d.getUTCDay()] }
}

/**
 * Parses a "23 November 2026" display date as UTC midnight without Date.parse
 * or local timezone drift, so SSR and client hydration agree across engines.
 */
export const parseDisplayDateUtc = (dateStr: string): number =>
  parseDisplayDateParts(dateStr)?.ms ?? NaN

/** "23 November 2026" -> "Monday", independent of browser locale or timezone. */
export const formatDisplayDateWeekday = (dateStr: string): string =>
  parseDisplayDateParts(dateStr)?.weekday ?? ""

/** "23 November 2026" -> "23 Nov" (or "23 Nov 2026" when `withYear` is true). */
export const formatDisplayDateShort = (
  dateStr: string,
  withYear = false
): string => {
  const parts = parseDisplayDateParts(dateStr)
  if (!parts) return dateStr
  const shortMonth = MONTHS[parts.monthIdx].slice(0, 3)
  return withYear
    ? `${parts.day} ${shortMonth} ${parts.year}`
    : `${parts.day} ${shortMonth}`
}

/**
 * Code-point string comparison. Unlike bare `localeCompare`, this never shifts
 * order for digraphs (e.g. AA in da-DK/nb-NO, CH in cs-CZ/sk-SK, CS in hu-HU),
 * keeping SSR HTML and client hydration identical across browser locales.
 */
export const compareCodePoints = (a: string, b: string): number =>
  a < b ? -1 : a > b ? 1 : 0
