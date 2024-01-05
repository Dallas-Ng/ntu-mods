import { useState } from "react"
import { useBoundState } from "@/state/bound-state"

import { DAY_MAP } from "@/config/stars"
import { C_DATA } from "@/lib/consolidated-data"

interface Props {
  courseKey: string
  disableSelect?: boolean
}

export default function useIndexLogic(props: Props) {
  const { courseKey, disableSelect = false } = props
  const { addCourseToIndex } = useBoundState()

  const course = C_DATA[courseKey]
  const courseIndexes = course ? course.indexes : ([] as unknown as CourseIndex)
  const [filteredIndexes, setFilteredIndexes] =
    useState<CourseIndex>(courseIndexes)

  /**
   * Search through the course attributes
   */
  const handleSearch = (searchTerm: string) => {
    const lSearchTerm = searchTerm.toLowerCase()

    if (searchTerm === "") return setFilteredIndexes(courseIndexes)

    const temp: CourseIndex = {}

    for (const [ciKey, ciVal] of Object.entries(courseIndexes)) {
      const keyMatches = ciKey.toLowerCase().includes(lSearchTerm)
      const valueMatches = ciVal.some((item) =>
        Object.entries(item).some(([itemKey, itemVal]) =>
          typeof itemVal === "string"
            ? itemVal.toLowerCase().includes(lSearchTerm)
            : // means itemVal is a number
              itemKey != "duration" && // duration is also a number, so dont use it to filter days
              DAY_MAP[itemVal].toLowerCase().includes(lSearchTerm)
        )
      )

      if (keyMatches || valueMatches) temp[ciKey] = ciVal
    }

    setFilteredIndexes(temp)
  }

  const handleSelect = (idxKey: string) => {
    if (disableSelect) return
    addCourseToIndex(courseKey, courseIndexes[idxKey])
  }

  return { handleSearch, handleSelect, filteredIndexes }
}
