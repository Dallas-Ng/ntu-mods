"use client"

import { useEffect, useState } from "react"
import CONSOLIDATED_DATA from "@/data/consolidated-2023-2.json"
import { useBoundState } from "@/state/bound-state"
import { Check, ChevronsUpDown } from "lucide-react"

import { getCDataCourse } from "@/lib/consolidated-data"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"

const STORED_KEYS = Object.keys(CONSOLIDATED_DATA)

export function CourseCodeSelect() {
  const [windowOpen, setWindowOpen] = useState(false)
  const [currCourse, setCurrCourse] = useState<string>()
  const [inputValue, setInputValue] = useState<string>("")
  const [courseCodes, setCourseCode] = useState<string[]>([])

  const {
    courses,
    coursesToIndex,
    addCourse,
    addCourseToIndex,
    removeCourse,
    removeCourseToIndex
  } = useBoundState((s) => s)

  const dbSearchTerm = useDebounce(inputValue, 0) // arbitrary delay

  useEffect(() => {
    /**
     * Return empty list if there is no search term, showing all course code is very taxing for UI
     * showing all codes also encourages users to find via scrolling rather than searching
     *
     * Keep this at the top so the filter function does not happen if there are no searched terms
     */
    if (!dbSearchTerm) return setCourseCode([])

    const courseCodes: string[] = []

    STORED_KEYS.filter((x) => {
      if (dbSearchTerm.length === 1) {
        return x.toLowerCase().startsWith(dbSearchTerm.toLowerCase())
      } else {
        return x.toLowerCase().includes(dbSearchTerm.toLowerCase())
      }
    }).forEach((key) => courseCodes.push(key))

    setCourseCode(courseCodes)
  }, [dbSearchTerm])

  const handleSelect = (val: string) => {
    // .toUpperCase is needed as courseCode is auto lowercased when passed as prop into CommandItem
    const value = val.toUpperCase()

    // If user clicks on a course in store, we will remove it out
    const course = getCDataCourse(value)

    if (courses.find((x) => x.key === value)) {
      removeCourse(value)
      removeCourseToIndex(course.key)
      setCurrCourse(undefined) // reset placeholder
    } else {
      /**
       * Checks for conflicts between the selected course indexes and existing courses.
       * If a conflict is found, it selects the next available index without conflicts.
       * If no index is available, it will select the first index.
       */
      let selectedIndexes = course.indexes[0]

      Object.values(course.indexes).every((courseIndex) => {
        let hasConflict = false

        courseIndex.forEach((index) => {
          Object.values(coursesToIndex).forEach((existingCoursesIndex) => {
            existingCoursesIndex.forEach((existingIndex) => {
              const [currentStart, currentEnd] = existingIndex.time
                .split("-")
                .map(Number)
              const [previousStart, previousEnd] = index.time
                .split("-")
                .map(Number)

              hasConflict =
                currentStart < previousEnd && currentEnd > previousStart
            })
          })
        })

        if (!hasConflict) {
          selectedIndexes = courseIndex
          return false // Break out of the some loop
        }

        return true
      })

      addCourse(course)
      addCourseToIndex(course.key, selectedIndexes)
      setCurrCourse(value)
    }

    // setWindowOpen(false)
  }

  return (
    <Popover open={windowOpen} onOpenChange={setWindowOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={windowOpen}
          className="w-[200px] justify-between">
          {currCourse ?? "Select course code"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-screen p-0 md:w-[200px]">
        <Command>
          <CommandInput
            placeholder="Search course code"
            onValueChange={(v) => setInputValue(v)}
          />

          <CommandEmpty>No course code found</CommandEmpty>

          <CommandGroup
            className={cn(
              courseCodes.length > 0 ? "block" : "hidden",
              "max-h-[400px] overflow-auto"
            )}>
            {courseCodes.map((courseCode) => (
              <CommandItem
                key={courseCode}
                value={courseCode}
                onSelect={handleSelect}>
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    courses.find((x) => x.key === courseCode)
                      ? "opacity-100"
                      : "opacity-0"
                  )}
                />
                {courseCode}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
