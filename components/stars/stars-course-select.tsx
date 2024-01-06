"use client"

import { useEffect, useRef, useState } from "react"
import { useBoundState } from "@/state/bound-state"
import { Check, ChevronsUpDown } from "lucide-react"

import { C_DATA, getCourse } from "@/lib/consolidated-data"
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

const STORED_KEYS = Object.keys(C_DATA)

interface Props {
  btnClassName?: React.HtmlHTMLAttributes<HTMLDivElement>["className"]
}

export default function StarsCourseSelect(props: Props) {
  const [windowOpen, setWindowOpen] = useState(false)
  const [inputValue, setInputValue] = useState<string>("")
  const [courseCodes, setCourseCode] = useState<string[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  const { coursesToIndex, addCourseToIndex, removeCourseToIndex } =
    useBoundState()

  const dbSearchTerm = useDebounce(inputValue, 200) // arbitrary delay - anything lower makes it feel laggy

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
    const course = getCourse(value)

    if (Object.keys(coursesToIndex).includes(val.toUpperCase())) {
      removeCourseToIndex(course.key)
    } else {
      /**
       * Checks for conflicts between the selected course indexes and existing courses.
       * If a conflict is found, it selects the next available index without conflicts.
       * If no index is available, it will select the first index.
       */
      let selectedIndexes = Object.values(course.indexes)[0]

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

      addCourseToIndex(course.key, selectedIndexes)
    }

    // setWindowOpen(false)
  }

  return (
    <div ref={containerRef} className="h-min w-min">
      <Popover open={windowOpen} onOpenChange={setWindowOpen}>
        <PopoverTrigger type={undefined} asChild>
          <Button
            variant="outline"
            className={cn("w-full", props.btnClassName)}>
            Select Course Code
            <ChevronsUpDown className="ml-1 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          container={containerRef.current}
          className={cn("z-[33] w-full p-1")}
          style={{ width: containerRef.current?.clientWidth }}>
          <Command>
            <CommandInput
              className="w-full"
              placeholder="Search Course Code"
              value={inputValue}
              onValueChange={(v) => setInputValue(v)}
            />

            {dbSearchTerm !== "" && (
              <CommandEmpty>No course code found</CommandEmpty>
            )}

            <CommandGroup
              className={cn(
                courseCodes.length > 0 ? "block" : "hidden",
                "max-h-[400px] overflow-auto"
              )}>
              {courseCodes.map((courseCode) => {
                const isActive = Object.keys(coursesToIndex).find(
                  (x) => x === courseCode
                )

                return (
                  <CommandItem
                    key={courseCode}
                    value={courseCode}
                    onSelect={handleSelect}
                    className="cursor-pointer py-3 md:py-2">
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isActive ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {courseCode}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
