export const TOTAL_TEACHING_WEEKS = 13

export const ALL_TEACHING_WEEKS = Array.from(
  { length: TOTAL_TEACHING_WEEKS },
  (_, i) => i + 1
)

/**
 * Parse a remarks string (e.g. "Teaching Wk1,3-13") into the sorted list of
 * teaching week numbers (1-13) an index slot actually runs on.
 */
export const parseTeachingWeeks = (remarks: string): number[] => {
  const trimmed = remarks.trim()
  if (trimmed === "") return [...ALL_TEACHING_WEEKS]
  if (trimmed === "Not conducted during Teaching Weeks") return []

  const match = trimmed.match(/^Teaching Wk(.+)$/)
  if (!match) return [...ALL_TEACHING_WEEKS]

  const weeks = new Set<number>()
  for (const token of match[1].split(",")) {
    const [start, end] = token.split("-").map(Number)
    if (!Number.isFinite(start)) continue
    const last = Number.isFinite(end) ? end : start
    for (let week = start; week <= last; week++) weeks.add(week)
  }
  return [...weeks].sort((a, b) => a - b)
}

/** True when two week lists share at least one teaching week. */
export const weeksOverlap = (a: number[], b: number[]): boolean => {
  if (!a.length || !b.length) return false
  const set = new Set(a)
  return b.some((w) => set.has(w))
}
