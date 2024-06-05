"use client"

import { useEffect, useRef, useState } from "react"
import { TRUN_M_DATA } from "@/data/2024/trun-m-data"
import { Check } from "lucide-react"

import { getIndex } from "@/lib/get-index"
import { getModuleIndexes } from "@/lib/get-module-indexes"
import { parseTimeNumber } from "@/lib/parse-time"
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
  const [disabled, setDisabled] = useState(false)

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
    setDisabled(true)
    // .toUpperCase is needed as courseCode is auto lowercased when passed as prop into CommandItem
    const moduleKey = val.toUpperCase()

    // If module is already in timetable, remove it
    if (Object.keys(timetable).find((x) => x === moduleKey)) {
      removeItemFromTimetable(moduleKey)
      setDisabled(false)
      return
    }

    const indexes = getModuleIndexes(moduleKey)
    let selectedIndexKey = indexes[Object.keys(indexes)[0]][0].key

    /**
     * Conflict resolution
     * Assigns the best index upon user's selection
     *  - No conflicts within existing index (i.e. try not to increase day-cols)
     *
     * If unable to find best index, assign based on default key (first in JSON)
     */

    let hasConflict = false

    Object.values(indexes).every((newModuleIndex) => {
      newModuleIndex.forEach((newIndex) => {
        Object.values(timetable).forEach((timetableIndex) => {
          const existingIndex = getIndex(timetableIndex)

          existingIndex.forEach((extIndex) => {
            if (extIndex.day === newIndex.day) {
              const { startTime: newStartTime, endTime: newEndTime } =
                parseTimeNumber(newIndex)
              const { startTime: extStartTime, endTime: extEndTime } =
                parseTimeNumber(extIndex)

              if (
                // Check if the start time of the new index falls within the existing index's time slot
                (newStartTime >= extStartTime && newStartTime < extEndTime) ||
                // Check if the end time of the new index falls within the existing index's time slot
                (newEndTime > extStartTime && newEndTime <= extEndTime) ||
                // Check if the existing index is completely within the new index's time slot
                (newStartTime <= extStartTime && newEndTime >= extEndTime)
              ) {
                hasConflict = true
              }
            }
          })
        })

        if (!hasConflict) {
          selectedIndexKey = newIndex.key
          return false // Break out of the every loop
        } else {
          hasConflict = false // reset the flag so that we can check again
        }
      })

      return true
    })

    addItemToTimetable(moduleKey, selectedIndexKey)
    setDisabled(false)
  }

  return (
    <div ref={ref} className="rounded-md border-2">
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
                disabled={disabled}
                onSelect={() => (disabled ? null : handleSelect(moduleKey))}
                className="cursor-pointer py-3 transition-colors hover:bg-accent lg:py-2">
                <Check
                  className={cn(
                    "mr-2 size-4 transition-opacity",
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
