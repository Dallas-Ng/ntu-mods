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

  const store = useBoundState((s) => s)

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
    const defaultIndexKey = Object.keys(course.indexes)[0]

    if (store.courses.find((x) => x.key === value)) {
      store.removeCourse(value)
      store.removeCourseToIndex(course.key)
      setCurrCourse(undefined) // reset placeholder
    } else {
      store.addCourse(course)
      store.addCourseToIndex(course.key, course.indexes[defaultIndexKey])
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

      <PopoverContent className="w-[200px] p-0">
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
                    store.courses.find((x) => x.key === courseCode)
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
