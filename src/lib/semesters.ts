import SEMESTERS_JSON from "@/data/api/semesters.json"

export const [latestYear, latestSemester] = (
  SEMESTERS_JSON[0]?.code ?? "2025;2"
).split(";")

const isSpecialTermCode = (semester: string) =>
  semester === "S" || semester === "T"

/** "2026;2" -> ["2026", "2"] */
export const splitSemester = (key: string) =>
  key.split(";") as [year: string, semester: string]

export const semesterLabel = (key: string) => {
  const [year, semester] = splitSemester(key)
  return isSpecialTermCode(semester)
    ? `AY${year} Special Term`
    : `AY${year} Semester ${semester}`
}

export const semesterLabelShort = (key: string) => {
  const [year, semester] = splitSemester(key)
  return isSpecialTermCode(semester)
    ? `AY${year} Special Term`
    : `AY${year} S${semester}`
}

export const LATEST_SEMESTER_LABEL = semesterLabel(
  `${latestYear};${latestSemester}`
)

export const LATEST_SEMESTER_LABEL_SHORT = semesterLabelShort(
  `${latestYear};${latestSemester}`
)

/**
 * The two newest regular semesters with data, newest first: the ones a student
 * can plan in. Publishing a newer semester pushes the oldest out of this list.
 * Special terms are left out; they are a small cohort and have no Week 1 date.
 */
export const SELECTABLE_SEMESTERS: string[] = SEMESTERS_JSON.map((s) => s.code)
  .filter((code) => !isSpecialTermCode(splitSemester(code)[1]))
  .slice(0, 2)

/** What a visitor with no saved choice sees: the newest published semester. */
export const DEFAULT_SEMESTER: string =
  SELECTABLE_SEMESTERS[0] ?? `${latestYear};${latestSemester}`

export const isSelectableSemester = (key: string | null | undefined) =>
  key != null && SELECTABLE_SEMESTERS.includes(key)

/** A saved/URL semester if it is still selectable, otherwise the default. */
export const resolveSemester = (key: string | null | undefined) =>
  key != null && isSelectableSemester(key) ? key : DEFAULT_SEMESTER

/** Every semester with data, newest first; old share links may point at any of them. */
export const PUBLISHED_SEMESTERS: string[] = SEMESTERS_JSON.map((s) => s.code)
