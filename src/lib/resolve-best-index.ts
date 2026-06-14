import { parseTimeNumber } from "./parse-time"

export function resolveBestIndex(
  moduleIndexes: Record<string, Index[]>,
  timetable: Timetable,
  seasonIndexes: Record<string, Record<string, Index[]>>
): string {
  const existingIndexLookup: Record<string, Index[]> = {}
  for (const code of Object.keys(timetable)) {
    const selectedKey = timetable[code]
    const modIndexes = seasonIndexes[code]
    if (selectedKey && modIndexes?.[selectedKey]) {
      existingIndexLookup[selectedKey] = modIndexes[selectedKey]
    }
  }

  let selectedIndexKey = moduleIndexes[Object.keys(moduleIndexes)[0]][0].key
  let hasConflict = false

  Object.values(moduleIndexes).every((newModuleIndex) => {
    newModuleIndex.forEach((newIndex) => {
      Object.values(timetable).forEach((timetableIndex) => {
        const existingIndex = existingIndexLookup[timetableIndex] ?? []

        existingIndex.forEach((extIndex) => {
          if (extIndex.day === newIndex.day) {
            const { startTime: newStart, endTime: newEnd } =
              parseTimeNumber(newIndex)
            const { startTime: extStart, endTime: extEnd } =
              parseTimeNumber(extIndex)

            if (
              (newStart >= extStart && newStart < extEnd) ||
              (newEnd > extStart && newEnd <= extEnd) ||
              (newStart <= extStart && newEnd >= extEnd)
            ) {
              hasConflict = true
            }
          }
        })
      })

      if (!hasConflict) {
        selectedIndexKey = newIndex.key
        return false
      } else {
        hasConflict = false
      }
    })

    return true
  })

  return selectedIndexKey
}
