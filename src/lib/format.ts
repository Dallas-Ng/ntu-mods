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

const SHORT_MONTHS = [
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

/**
 * "2026-09-03" -> "3 Sep 2026". Read in UTC with fixed month names, so the
 * prerendered HTML and the browser agree whatever the visitor's timezone or
 * ICU build (toLocaleDateString shifted the day west of UTC and spells
 * September "Sept" or "Sep" depending on the engine).
 */
export const formatShortDate = (date: string) => {
  const d = new Date(date)
  return `${d.getUTCDate()} ${SHORT_MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}
