"use client"

import { useState } from "react"
import { useBoundState } from "@/state/bound-state"

import { DAY_MAP } from "@/config/stars"
import { C_DATA } from "@/lib/consolidated-data"
import { Button } from "@/components/ui/button"
import SheetPopover from "@/components/sheet-popover"

import IndexCommand from "./index-command"

interface Props {
  courseKey: string
}

export default function StarsIndexButton({ courseKey }: Props) {
  const { removeCourseToIndex, addCourseToIndex, coursesToIndex } =
    useBoundState()

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
    if (Object.keys(courseIndexes).includes(courseKey)) {
      removeCourseToIndex(courseKey)
    } else {
      addCourseToIndex(courseKey, courseIndexes[idxKey])
    }
  }

  return (
    <>
      <SheetPopover
        openChange={(open) => (open ? handleSearch("") : {})}
        triggerComponent={
          <Button variant="outline" className="w-full px-6 text-sm">
            {coursesToIndex[courseKey][0].key}
          </Button>
        }
        popoverContent={
          <IndexCommand
            filteredIndexes={filteredIndexes}
            handleSearch={handleSearch}
            handleSelect={handleSelect}
            commandClassName="max-h-[450px] overflow-auto"
          />
        }
        sheetContent={
          <IndexCommand
            filteredIndexes={filteredIndexes}
            handleSearch={handleSearch}
            handleSelect={handleSelect}
            commandClassName="overflow-auto"
          />
        }
      />
    </>
  )
}
