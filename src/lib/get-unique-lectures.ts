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

  const { key: key1, ...modifiedObject1 } = obj1
  const { key: key2, ...modifiedObject2 } = obj2
  return (
    JSON.stringify({ ...modifiedObject2 }) === JSON.stringify(modifiedObject1)
  )
}

/**
 * Get unique lectures from the moduleIndexMap
 */
export const getUniqueLectures = (
  moduleIndexMap: TimetableWithIndex,
  ignoreIndexKey = true
) => {
  return Object.values(moduleIndexMap)
    .flat()
    .filter((x) => getIndexType(x.type) === "LEC")
    .filter(
      (item, index, arr) =>
        arr.findIndex((obj) => areObjectsEqual(obj, item, ignoreIndexKey)) ===
        index
    )
}
