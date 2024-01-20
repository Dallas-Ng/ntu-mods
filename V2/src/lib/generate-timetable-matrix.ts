import { STARS_TIMESLOTS } from "./constants"
import { parseTimeNumber } from "./parse-time"

/**
 * Helper function to get the first timeslot idx of the index
 */
export const getFirstTsIndex = (index: Index) => {
  return STARS_TIMESLOTS.findIndex(
    (ts) => ts.start === parseTimeNumber(index).startTime
  )
}

export const generateTimetableMatrix = (
  moduleIndexes: TimetableWithIndex,
  maxColumnsThreshold = 9
) => {
  const moduleIndexesFlat = Object.values(moduleIndexes).flat()

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

    // Add index into respective matrix position
    TABLE_MATRIX[tsIndex][index.day - 1].push(index)

    // If the index has a duration of more than 1, append to the rest of the rows
    // This is used to do offsets of the table cell
    for (let i = 1; i < index.duration; i++) {
      TABLE_MATRIX[tsIndex + i][index.day - 1].push(index)
    }
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

  Object.entries(TABLE_MATRIX).forEach(([key, rowData]) => {
    // remove empty rows
    if (rowData.every((dayCol) => dayCol.length === 0)) {
      delete TABLE_MATRIX[parseInt(key)]
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
