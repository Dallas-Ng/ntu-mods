import { STARS_TIMESLOTS } from "./constants"
import { getIndexType } from "./get-index-type"
import { getUniqueLectures } from "./get-unique-lectures"
import { parseTimeNumber } from "./parse-time"

/**
 * Helper function to get the first timeslot idx of the index
 */
export const getFirstTsIndex = (index: Index) => {
  return STARS_TIMESLOTS.findIndex(
    (ts) => ts.start === parseTimeNumber(index).startTime
  )
}

/**
 * One index can list the same class twice for the same day and time, differing
 * only in venue and remarks (e.g. a seminar in a room for most weeks and online
 * for one). Drawing each as its own cell puts two identical-looking blocks side
 * by side, so fold them into one entry that carries both venues and remarks.
 */
const mergeSameSlotVariations = (slots: Index[]): Index[] => {
  const merged = new Map<string, Index>()
  for (const slot of slots) {
    const id = [slot.key, slot.type, slot.group, slot.day, slot.time].join("|")
    const existing = merged.get(id)
    if (!existing) {
      merged.set(id, slot)
      continue
    }
    const join = (a: string, b: string) =>
      [...new Set([...a.split(", "), ...b.split(", ")].filter(Boolean))].join(
        ", "
      )
    merged.set(id, {
      ...existing,
      venue: join(existing.venue, slot.venue),
      remarks: join(existing.remarks, slot.remarks)
    })
  }
  return [...merged.values()]
}

export const generateTimetableMatrix = (
  moduleIndexes: TimetableWithIndex,
  maxColumnsThreshold = 9,
  uniqueLecturesIgnoreIndexKey = true
) => {
  // Identify unique lectures
  const uniqueLectures = getUniqueLectures(
    moduleIndexes,
    uniqueLecturesIgnoreIndexKey
  )

  // Flatten module indexes: use uniqueLectures directly so their venues are
  // already collapsed (e.g. "Multiple Venues"). Non-lecture slots from all indexes.
  const moduleIndexesFlat = [
    ...mergeSameSlotVariations(uniqueLectures),
    ...mergeSameSlotVariations(
      Object.values(moduleIndexes)
        .flat()
        .filter((index) => getIndexType(index.type) !== "LEC")
    )
  ]

  /**
   * Remove LECTURE indexes that are not unique
   */
  Object.keys(moduleIndexes).forEach((moduleKey) => {
    moduleIndexes[moduleKey] = moduleIndexes[moduleKey].filter((lecture) => {
      if (getIndexType(lecture.type) === "LEC") {
        return uniqueLectures.some(
          (uniqueLecture) => uniqueLecture.key === lecture.key
        )
      } else {
        return true // Keep other types of indexes
      }
    })
  })

  /**
   * Generate the max columns for each day
   */
  const TABLE_MAX_DAY_COLUMNS: { [dayIndex: number]: number } = {
    1: 1,
    2: 1,
    3: 1,
    4: 1,
    5: 1,
    6: 1,
    7: 1
  }

  /**
   * Generate a matrix of indexes based on the timeslot
   * - Each row represents a timeslot
   *  - Each column represents a day
   *    - Each cell represents an index
   */
  const TABLE_MATRIX: { [tsIndex: number]: Index[][] } = {}
  for (let i = 0; i < STARS_TIMESLOTS.length; i++) {
    TABLE_MATRIX[i] = Array(7)
      .fill([])
      .map(() => [])
  }

  // Populate the matrix
  Object.values(moduleIndexesFlat).forEach((index) => {
    const { startTime } = parseTimeNumber(index)
    const tsIndex = STARS_TIMESLOTS.findIndex((ts) => ts.start === startTime)

    // @TODO For modules with day null
    if (!index.day) {
      return
    }

    // Add index into respective matrix position
    TABLE_MATRIX[tsIndex][index.day - 1].push(index)

    // If the index has a duration of more than 1, append to the rest of the rows
    // This is used to do offsets of the table cell
    for (let i = 1; i < index.duration; i++) {
      TABLE_MATRIX[tsIndex + i][index.day - 1].push(index)
    }
  })

  /**
   * Sort the indexes in each cell by duration
   * Higher duration to lower duration, this helps create a visual pattern
   */
  Object.values(TABLE_MATRIX).forEach((row) => {
    row.forEach((day) => {
      day.sort((a, b) => b.duration - a.duration)
    })
  })

  /**
   * Generate the max columns for each day
   * - This is used to generate the colspan for each cell
   */
  Object.values(TABLE_MATRIX).forEach((row) => {
    row.forEach((day, idx) => {
      TABLE_MAX_DAY_COLUMNS[idx + 1] = Math.max(
        TABLE_MAX_DAY_COLUMNS[idx + 1],
        day.length
      )
    })
  })

  /**
   * Cleaning of the matrix
   * - Remove empty rows (timeslots)
   * - Remove empty columns (days - only saturday and sunday)
   */
  // Checks saturday and sunday for empty columns
  const hasNoSundayIndexes = Object.values(TABLE_MATRIX).every(
    (rowData) => rowData[6].length === 0
  )
  const hasNoSaturdayIndexes = Object.values(TABLE_MATRIX).every(
    (rowData) => rowData[5].length === 0
  )

  /**
   * Get the earliest and latest ts index so that we can show the
   * empty rows in between
   */
  let earliestTime = 2359
  let latestTime = 700 // This should be the earliest time that a index can have

  moduleIndexesFlat.forEach((index) => {
    const { startTime, endTime } = parseTimeNumber(index)

    if (startTime < earliestTime) earliestTime = startTime
    if (endTime > latestTime) latestTime = endTime
  })

  const earliestTsIndex = Object.values(STARS_TIMESLOTS).findIndex(
    (x) => x.start === earliestTime
  )
  const latestTsIndex = Object.values(STARS_TIMESLOTS).findIndex(
    (x) => x.end >= latestTime
  )

  Object.entries(TABLE_MATRIX).forEach(([key, rowData], idx) => {
    // remove empty rows
    if (moduleIndexesFlat.length > 0) {
      if (earliestTsIndex > idx || idx > latestTsIndex) {
        delete TABLE_MATRIX[parseInt(key)]
      }
    } else {
      // Show 0930 to 1830 when there are no indexes
      // Should sync with the loading component
      if (idx > 20 || idx < 3) {
        delete TABLE_MATRIX[parseInt(key)]
      }
    }

    // Need to show saturday if there are sunday indexes
    if (hasNoSundayIndexes) {
      delete TABLE_MAX_DAY_COLUMNS[7]

      if (hasNoSaturdayIndexes) delete TABLE_MAX_DAY_COLUMNS[6]
    }
  })

  // Check if table should allow overflowing
  const sumMaxDayColumns = Object.values(TABLE_MAX_DAY_COLUMNS).reduce(
    (acc, cell) => acc + cell,
    0
  )
  const TABLE_OVERFLOW_THRESHOLD = sumMaxDayColumns > maxColumnsThreshold

  return {
    TABLE_MATRIX,
    TABLE_OVERFLOW_THRESHOLD,
    TABLE_MAX_DAY_COLUMNS
  }
}
