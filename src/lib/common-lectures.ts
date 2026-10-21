import { isCustomCourseKey } from "@/lib/custom-course-colors"
import { getIndexType } from "@/lib/get-index-type"

/** Identifies one lecture slot of a module, whichever index it belongs to. */
export const commonLectureId = (moduleKey: string, slot: Index) =>
  `${moduleKey}|${slot.day}|${slot.time}|${slot.venue}`

/**
 * Lectures that every index of a module has, at the same day, time and venue:
 * the module's common lectures. Picking another index does not change them.
 */
export const findCommonLectures = (
  allModuleIndexes: Record<string, Record<string, Index[]>>
) => {
  const common = new Set<string>()
  for (const [moduleKey, indexes] of Object.entries(allModuleIndexes)) {
    if (isCustomCourseKey(moduleKey)) continue
    const lists = Object.values(indexes)
    if (lists.length < 2) continue
    const counts = new Map<string, number>()
    for (const slots of lists) {
      const seen = new Set<string>()
      for (const slot of slots) {
        if (getIndexType(slot.type) !== "LEC") continue
        seen.add(commonLectureId(moduleKey, slot))
      }
      for (const id of seen) counts.set(id, (counts.get(id) ?? 0) + 1)
    }
    for (const [id, n] of counts) if (n === lists.length) common.add(id)
  }
  return common
}
