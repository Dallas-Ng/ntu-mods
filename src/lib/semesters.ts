import SEMESTERS_JSON from "@/data/api/semesters.json"

export const [latestYear, latestSemester] = (
  SEMESTERS_JSON[0]?.code ?? "2025;2"
).split(";")

const isSpecialTerm = latestSemester === "S" || latestSemester === "T"

export const LATEST_SEMESTER_LABEL = isSpecialTerm
  ? `AY${latestYear} Special Term`
  : `AY${latestYear} Semester ${latestSemester}`

export const LATEST_SEMESTER_LABEL_SHORT = isSpecialTerm
  ? `AY${latestYear} Special Term`
  : `AY${latestYear} S${latestSemester}`

/**
 * Two-digit academic year, e.g. "AY26/27 S2", for tight spots like filter
 * chips.
 */
export const LATEST_SEMESTER_LABEL_COMPACT = `AY${latestYear.slice(2)}/${String(Number(latestYear) + 1).slice(2)} ${isSpecialTerm ? "Special Term" : `S${latestSemester}`}`
