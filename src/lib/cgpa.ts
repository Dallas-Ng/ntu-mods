// CGPA planner: what average grade the remaining AU need to reach each NTU
// honours class. Pure functions so they run in the browser and under vitest.

import type { Mod } from "@/lib/fgo"

// Minimum CGPA per class for NTU honours degrees. A few programmes publish
// their own bands, so the page tells students to confirm with their school.
export const HONOURS_BANDS = [
  { label: "Highest Distinction", min: 4.5 },
  { label: "Distinction", min: 4 },
  { label: "Merit", min: 3.5 },
  { label: "Honours", min: 3 }
] as const

// Lowest first, so the first grade at or above a target is the lowest that works.
export const GRADES = [
  ["D", 1],
  ["D+", 1.5],
  ["C", 2],
  ["C+", 2.5],
  ["B-", 3],
  ["B", 3.5],
  ["B+", 4],
  ["A-", 4.5],
  ["A", 5]
] as const

/** Grade points and AU behind a transcript's CGPA (FGO and non-graded excluded). */
export function gradedTotals(mods: Mod[]) {
  let points = 0
  let au = 0
  for (const m of mods) {
    if (m.status !== "graded") continue
    points += m.au * m.gp
    au += m.au
  }
  return { points, au }
}

export type BandStatus = "secured" | "possible" | "out of reach"

export interface BandResult {
  label: string
  min: number
  /** Average grade points needed over the remaining AU. */
  required: number
  status: BandStatus
  /** Lowest letter grade that averages high enough, null unless possible. */
  grade: string | null
}

/**
 * Average grade points the remaining AU must earn to finish on `target`.
 * Zero or less means the class is secured whatever the remaining grades are.
 */
export function requiredAverage(
  cgpa: number,
  doneAu: number,
  remainingAu: number,
  target: number
) {
  return (target * (doneAu + remainingAu) - cgpa * doneAu) / remainingAu
}

/** Lowest letter grade whose points reach `gp`, null above an A. */
export function gradeFor(gp: number) {
  return GRADES.find(([, pts]) => pts >= gp - 1e-9)?.[0] ?? null
}

export function planBands(
  cgpa: number,
  doneAu: number,
  remainingAu: number
): BandResult[] {
  return HONOURS_BANDS.map(({ label, min }) => {
    const required = requiredAverage(cgpa, doneAu, remainingAu, min)
    const status: BandStatus =
      required <= 0 ? "secured" : required > 5 ? "out of reach" : "possible"
    const grade = status === "possible" ? gradeFor(required) : null
    return { label, min, required, status, grade }
  })
}

/** CGPA after the remaining AU all earn `avg` grade points. */
export function projectedCgpa(
  cgpa: number,
  doneAu: number,
  remainingAu: number,
  avg: number
) {
  return (cgpa * doneAu + avg * remainingAu) / (doneAu + remainingAu)
}

/** Highest honours class a CGPA reaches, or null below the lowest band. */
export function classFor(cgpa: number) {
  return HONOURS_BANDS.find((b) => cgpa >= b.min - 1e-9)?.label ?? null
}
