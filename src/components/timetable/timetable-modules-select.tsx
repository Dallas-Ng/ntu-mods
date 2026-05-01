"use client"

import { useRef, useState } from "react"
import { Check } from "lucide-react"

import { parseTimeNumber } from "@/lib/parse-time"
import { cn } from "@/lib/utils"
import { useLatestSemester } from "@/hooks/use-latest-semester"
import { useModuleSearchApi } from "@/hooks/use-module-search-api"
import { useOutsideClick } from "@/hooks/use-outside-click"
import { useTimetable } from "@/hooks/use-timetable"
import {
  Command,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command"

const TimetableModulesSelect = () => {
  const [inputValue, setInputValue] = useState("")
  const [isLoadingModule, setIsLoadingModule] = useState(false)
  const { timetable, addItemToTimetable, removeItemFromTimetable } =
    useTimetable()
  const { year, semester } = useLatestSemester()
  const { results: searchResults } = useModuleSearchApi(inputValue, 300)
  const ref = useRef<HTMLDivElement>(null)
  const [disabled, setDisabled] = useState(false)

  const isModuleWindowOpen =
    searchResults.length > 0 ||
    (searchResults.length === 0 && inputValue.length !== 0)

  useOutsideClick(ref, () => {
    /**
     * Clear input value when user clicks outside
     */
    setInputValue("")
  })

  const handleSelect = async (moduleCode: string) => {
    setDisabled(true)
    setIsLoadingModule(true)

    try {
      const moduleKey = moduleCode.toUpperCase()

      // If module is already in timetable, remove it
      if (Object.keys(timetable).find((x) => x === moduleKey)) {
        removeItemFromTimetable(moduleKey)
        setDisabled(false)
        setIsLoadingModule(false)
        return
      }

      const params = new URLSearchParams({ year, semester })

      // Fetch indexes for the new module and all existing timetable modules in parallel
      const existingCodes = Object.keys(timetable)
      const [newModuleRes, ...existingResponses] = await Promise.all([
        fetch(`/api/data/modules/${moduleKey}/indexes?${params}`),
        ...existingCodes.map((code) =>
          fetch(`/api/data/modules/${code}/indexes?${params}`)
            .then((res) => (res.ok ? res.json() : { indexes: {} }))
            .then((data: { indexes: Record<string, Index[]> }) => ({
              code,
              indexes: data.indexes ?? {}
            }))
            .catch(() => ({ code, indexes: {} as Record<string, Index[]> }))
        )
      ])

      if (!newModuleRes.ok) {
        throw new Error("Failed to load module indexes")
      }

      const data = await newModuleRes.json()
      const indexes = data.indexes

      if (!indexes || Object.keys(indexes).length === 0) {
        throw new Error("No indexes available for this module")
      }

      // Build flat existing index lookup: { indexKey: Index[] }
      const existingIndexLookup: Record<string, Index[]> = {}
      for (const { code, indexes: moduleIndexes } of existingResponses) {
        const selectedKey = timetable[code]
        if (selectedKey && moduleIndexes[selectedKey]) {
          existingIndexLookup[selectedKey] = moduleIndexes[selectedKey]
        }
      }

      let selectedIndexKey = indexes[Object.keys(indexes)[0]][0].key

      /**
       * Conflict resolution
       * Assigns the best index upon user's selection
       *  - No conflicts within existing index (i.e. try not to increase day-cols)
       *
       * If unable to find best index, assign based on default key (first in JSON)
       */

      let hasConflict = false

      Object.values(indexes).every((newModuleIndex: any) => {
        newModuleIndex.forEach((newIndex: any) => {
          Object.values(timetable).forEach((timetableIndex) => {
            const existingIndex = existingIndexLookup[timetableIndex] ?? []

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
      setInputValue("")
    } catch (error) {
      console.error("Error selecting module:", error)
    } finally {
      setDisabled(false)
      setIsLoadingModule(false)
    }
  }

  return (
    <div ref={ref} className="rounded-md border-2">
      <Command shouldFilter={false} className="bg-background">
        <CommandInput
          placeholder="Search for Module"
          value={inputValue}
          onValueChange={(val) => setInputValue(val)}
        />

        <CommandList className={cn(isModuleWindowOpen && "border-t")}>
          {searchResults.length === 0 && inputValue.length !== 0 && (
            <CommandItem
              key="empty"
              disabled
              className="hover:bg-accent py-3 transition-colors lg:py-2">
              <div className="text-muted-foreground flex w-full flex-col text-center text-xs">
                <span className="pb-1">No Results Found</span>
                <hr className="p-1" />
                <span>Check the academic year, semester or search term</span>
              </div>
            </CommandItem>
          )}

          {searchResults.map((module) => {
            const isActive = Object.keys(timetable).find(
              (x) => x === module.code
            )

            return (
              <CommandItem
                key={module.code}
                value={module.code}
                disabled={disabled || isLoadingModule}
                onSelect={() => (disabled ? null : handleSelect(module.code))}
                className="hover:bg-accent cursor-pointer py-3 transition-colors lg:py-2">
                <Check
                  className={cn(
                    "mr-2 size-4 transition-opacity",
                    isActive ? "opacity-100" : "opacity-0"
                  )}
                />
                <div className="flex flex-col">
                  <span className="font-medium">{module.code}</span>
                  <span className="text-muted-foreground text-xs">
                    {module.title}
                  </span>
                </div>
              </CommandItem>
            )
          })}
        </CommandList>
      </Command>
    </div>
  )
}

export default TimetableModulesSelect
