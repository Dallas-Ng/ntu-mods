"use client"

import { useState } from "react"
import { useBoundState } from "@/state/bound-state"

import { DAY_MAPPING } from "@/config/stars"
import { C_DATA } from "@/lib/consolidated-data"

import StarsIndexSelect from "./stars-index-select"
import StarsIndexSheet from "./stars-index-sheet"

interface Props {
  courseKey: string
}

export default function StarsIndexButton({ courseKey }: Props) {
  const { removeCourseToIndex, addCourseToIndex } = useBoundState()

  const course: Course = C_DATA[courseKey as keyof typeof C_DATA]
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
              DAY_MAPPING[itemVal as keyof typeof DAY_MAPPING]
                .toLowerCase()
                .includes(lSearchTerm)
        )
      )

      if (keyMatches || valueMatches) temp[ciKey] = ciVal
    }

    setFilteredIndexes(temp)
  }

  const handleSelect = (idxKey: string) => {
    if (Object.keys(courseIndexes).includes(courseKey)) {
      removeCourseToIndex(courseKey)
    } else {
      addCourseToIndex(
        courseKey,
        courseIndexes[idxKey as keyof typeof courseIndexes]
      )
    }
  }

  return (
    <>
      <span className="hidden md:block">
        <StarsIndexSelect
          courseKey={courseKey}
          filteredIndexes={filteredIndexes}
          handleSearch={handleSearch}
          handleSelect={handleSelect}
        />
      </span>

      <span className="block md:hidden">
        <StarsIndexSheet
          courseKey={courseKey}
          filteredIndexes={filteredIndexes}
          handleSearch={handleSearch}
          handleSelect={handleSelect}
        />
      </span>
    </>
  )
}
