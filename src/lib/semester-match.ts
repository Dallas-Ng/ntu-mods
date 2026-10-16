import type { SeasonIndexes } from "@/hooks/use-season-indexes"

/**
 * Index numbers are reused across semesters with different slots, so a saved
 * timetable that carries no semester can only be placed by checking which
 * semester's data it actually fits.
 */

export interface TimetableFit {
  /** Modules whose chosen index exists in the semester's data. */
  exact: number
  /** Modules offered in the semester at all (index may differ). */
  offered: number
  total: number
}

export const fitTimetable = (
  timetable: Timetable,
  seasonIndexes: SeasonIndexes
): TimetableFit => {
  let exact = 0
  let offered = 0
  const entries = Object.entries(timetable)
  for (const [code, indexKey] of entries) {
    const moduleIndexes = seasonIndexes[code]
    if (!moduleIndexes || Object.keys(moduleIndexes).length === 0) continue
    offered++
    if (indexKey in moduleIndexes) exact++
  }
  return { exact, offered, total: entries.length }
}

/**
 * The semester a timetable (or several of them) fits best. `semesters` is
 * newest first; a tie goes to the older one, which is the semester most likely
 * to be running when someone still holds a pre-semester plan.
 */
export const bestMatchSemester = (
  timetables: Timetable[],
  indexesBySemester: Record<string, SeasonIndexes>,
  semesters: string[]
): string => {
  let best = semesters[semesters.length - 1]
  let bestScore: [number, number] = [-1, -1]

  for (const semester of [...semesters].reverse()) {
    const seasonIndexes = indexesBySemester[semester] ?? {}
    let exact = 0
    let offered = 0
    for (const timetable of timetables) {
      const fit = fitTimetable(timetable, seasonIndexes)
      exact += fit.exact
      offered += fit.offered
    }
    if (
      exact > bestScore[0] ||
      (exact === bestScore[0] && offered > bestScore[1])
    ) {
      best = semester
      bestScore = [exact, offered]
    }
  }
  return best
}

/** Codes in `timetable` that the semester does not offer. */
export const modulesNotOffered = (
  timetable: Timetable,
  seasonIndexes: SeasonIndexes
): string[] =>
  Object.keys(timetable).filter(
    (code) => Object.keys(seasonIndexes[code] ?? {}).length === 0
  )
