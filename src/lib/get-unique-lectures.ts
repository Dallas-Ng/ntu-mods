import { getIndexType } from "./get-index-type"

/**
 *
 */
const areObjectsEqual = (
  obj1: Index,
  obj2: Index,
  ignoreIndexKey = true
): boolean => {
  if (!ignoreIndexKey) {
    return JSON.stringify(obj1) === JSON.stringify(obj2)
  }

  const { key: key1, venue: v1, ...modifiedObject1 } = obj1
  const { key: key2, venue: v2, ...modifiedObject2 } = obj2
  return (
    JSON.stringify({ ...modifiedObject2 }) === JSON.stringify(modifiedObject1)
  )
}

/**
 * Get unique lectures from the moduleIndexMap.
 * Lectures sharing the same timeslot across multiple venues are collapsed into
 * one entry; if more than one venue existed the venue is shown as "Multiple Venues".
 */
export const getUniqueLectures = (
  moduleIndexMap: TimetableWithIndex,
  ignoreIndexKey = true
) => {
  const allLectures = Object.values(moduleIndexMap)
    .flat()
    .filter((x) => getIndexType(x.type) === "LEC")

  const uniqueLectures = allLectures.filter(
    (item, index, arr) =>
      arr.findIndex((obj) => areObjectsEqual(obj, item, ignoreIndexKey)) ===
      index
  )

  return uniqueLectures.map((lecture) => {
    const venueCount = allLectures.filter((l) =>
      areObjectsEqual(l, lecture, ignoreIndexKey)
    ).length
    return venueCount > 1 ? { ...lecture, venue: "Multiple Venues" } : lecture
  })
}
