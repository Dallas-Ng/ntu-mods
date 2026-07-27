import { parseTimeNumber } from "./parse-time"

export function resolveBestIndex(
  moduleIndexes: Record<string, Index[]>,
  timetable: Timetable,
  seasonIndexes: Record<string, Record<string, Index[]>>,
  /** Slots already occupied outside the timetable, e.g. custom blocks. */
  extraOccupiedSlots: Index[] = []
): string {
  const existingSlots: Index[] = [...extraOccupiedSlots]
  for (const code of Object.keys(timetable)) {
    const selectedKey = timetable[code]
    const slots = selectedKey ? seasonIndexes[code]?.[selectedKey] : undefined
    if (slots) existingSlots.push(...slots)
  }

  let selectedIndexKey = moduleIndexes[Object.keys(moduleIndexes)[0]][0].key
  let hasConflict = false

  Object.values(moduleIndexes).every((newModuleIndex) => {
    newModuleIndex.forEach((newIndex) => {
      existingSlots.forEach((extIndex) => {
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
