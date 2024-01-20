import { getIndex } from "./get-index"

export const getModuleIndexMap = (timetable: Timetable) => {
  let moduleIndexMap: TimetableWithIndex = {}

  for (let key in timetable) {
    const indexes = getIndex(timetable[key])
    if (indexes) moduleIndexMap[key] = indexes
  }

  return moduleIndexMap
}
