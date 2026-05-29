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
