"use client"

import { useEffect, useRef, useState } from "react"
import { TRUN_M_DATA } from "@/data/2023/trun-m-data"
import { Check } from "lucide-react"

import { getModuleIndexes } from "@/lib/get-module-indexes"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"
import { useOutsideClick } from "@/hooks/use-outside-click"
import { useTimetable } from "@/hooks/use-timetable"
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command"

const STORED_KEYS = Object.keys(TRUN_M_DATA)

const TimetableModulesSelect = () => {
  const [inputValue, setInputValue] = useState("")
  const [moduleCodes, setModuleCodes] = useState<string[]>([])
  const { timetable, addItemToTimetable, removeItemFromTimetable } =
    useTimetable()
  const ref = useRef<HTMLDivElement>(null)

  const dbSearchTerm = useDebounce(inputValue, 0)

  useOutsideClick(ref, () => {
    /**
     * Clear input value when user clicks outside
     */
    setInputValue("")
  })

  useEffect(() => {
    /**
     * Return empty list if there is no search term, showing all course code is very taxing for UI
     * showing all codes also encourages users to find via scrolling rather than searching
     *
     * Keep this at the top so the filter function does not happen if there are no searched terms
     */
    if (!dbSearchTerm) return setModuleCodes([])

    const courseCodes: string[] = []

    STORED_KEYS.filter((x) => {
      if (dbSearchTerm.length === 1) {
        return x.toLowerCase().startsWith(dbSearchTerm.toLowerCase())
      } else {
        return x.toLowerCase().includes(dbSearchTerm.toLowerCase())
      }
    }).forEach((key) => courseCodes.push(key))

    setModuleCodes(courseCodes)
  }, [dbSearchTerm])

  const handleSelect = (val: string) => {
    // .toUpperCase is needed as courseCode is auto lowercased when passed as prop into CommandItem
    const moduleKey = val.toUpperCase()

    // If module is already in timetable, remove it
    if (Object.keys(timetable).find((x) => x === moduleKey)) {
      removeItemFromTimetable(moduleKey)
      return
    }

    const indexes = getModuleIndexes(moduleKey)
    let selectedIndex = indexes[Object.keys(indexes)[0]]

    // TODO: Fix conflict detection

    // Object.values(indexes).every((moduleIndex) => {
    //   let hasConflict = false

    //   moduleIndex.forEach((index) => {
    //     Object.values(moduleIndexMap).forEach((existingCoursesIndex) => {
    //       existingCoursesIndex.forEach((existingIndex) => {
    //         const { startTime: previousStart, endTime: previousEnd } =
    //           parseTime(existingIndex)
    //         const { startTime: currentStart, endTime: currentEnd } =
    //           parseTime(index)

    //         if (currentStart < previousEnd && currentEnd > previousStart) {
    //           hasConflict = true
    //         }
    //       })
    //     })

    //     if (!hasConflict) {
    //       selectedIndex = moduleIndex
    //       return false // Break out of the every loop
    //     }
    //   })

    //   return true // Continue the every loop
    // })

    addItemToTimetable(moduleKey, selectedIndex[0].key)
  }

  return (
    <div ref={ref} className="rounded-md border">
      <Command shouldFilter={false} className="bg-background">
        <CommandInput
          placeholder="Search for Module"
          value={inputValue}
          onValueChange={(val) => setInputValue(val)}
        />

        <CommandList className={cn(moduleCodes.length > 0 && "border-t")}>
          {moduleCodes.map((moduleKey) => {
            const isActive = Object.keys(timetable).find((x) => x === moduleKey)

            return (
              <CommandItem
                key={moduleKey}
                value={moduleKey}
                onSelect={handleSelect}
                className="cursor-pointer py-3 transition-colors hover:bg-accent md:py-2">
                <Check
                  className={cn(
                    "mr-2 size-4",
                    isActive ? "opacity-100" : "opacity-0"
                  )}
                />
                {moduleKey}
              </CommandItem>
            )
          })}
        </CommandList>
      </Command>
    </div>
  )
}

export default TimetableModulesSelect
