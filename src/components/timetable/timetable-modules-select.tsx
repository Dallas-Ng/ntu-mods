"use client"

import { useRef, useState } from "react"
import { Check } from "lucide-react"
import posthog from "posthog-js"

import { resolveBestIndex } from "@/lib/resolve-best-index"
import { latestSemester, latestYear } from "@/lib/semesters"
import { cn } from "@/lib/utils"
import { useModuleSearchApi } from "@/hooks/use-module-search-api"
import { useOutsideClick } from "@/hooks/use-outside-click"
import { useSeasonIndexes } from "@/hooks/use-season-indexes"
import { useSettings } from "@/hooks/use-settings"
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
  const { results: searchResults } = useModuleSearchApi(inputValue, 300)
  const { isMobile } = useSettings()
  const { indexes: seasonIndexes } = useSeasonIndexes(
    latestYear,
    latestSemester
  )
  const ref = useRef<HTMLDivElement>(null)
  const [disabled, setDisabled] = useState(false)

  const isBulkInput = inputValue.includes(",")
  const isModuleWindowOpen =
    !isBulkInput &&
    (searchResults.length > 0 ||
      (searchResults.length === 0 && inputValue.length !== 0))

  useOutsideClick(ref, () => {
    /**
     * Clear input value when user clicks outside
     */
    setInputValue("")
  })

  const handleSelect = async (moduleCode: string): Promise<boolean> => {
    setDisabled(true)
    setIsLoadingModule(true)

    try {
      const moduleKey = moduleCode.toUpperCase()

      // If module is already in timetable, remove it
      if (Object.keys(timetable).find((x) => x === moduleKey)) {
        removeItemFromTimetable(moduleKey)
        posthog.capture("module_removed", { module_code: moduleKey })
        if (isMobile) setInputValue("")
        setDisabled(false)
        setIsLoadingModule(false)
        return true
      }

      // Read indexes from already-fetched season cache (no API call)
      const indexes = seasonIndexes[moduleKey]

      if (!indexes || Object.keys(indexes).length === 0) {
        throw new Error("No indexes available for this module")
      }

      const selectedIndexKey = resolveBestIndex(
        indexes,
        timetable,
        seasonIndexes
      )

      addItemToTimetable(moduleKey, selectedIndexKey)
      posthog.capture("module_added", {
        module_code: moduleKey,
        index_key: selectedIndexKey,
        total_modules: Object.keys(timetable).length + 1
      })
      if (isMobile) setInputValue("")
      return true
    } catch (error) {
      console.error("Error selecting module:", error)
      return false
    } finally {
      setDisabled(false)
      setIsLoadingModule(false)
    }
  }

  return (
    <div ref={ref} className="rounded-md border-2">
      <Command shouldFilter={false} className="bg-background">
        <CommandInput
          placeholder="Search or paste AA1234, BB2345, ..."
          value={inputValue}
          onValueChange={(val) => setInputValue(val)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && inputValue.includes(",")) {
              e.preventDefault()
              const codes = inputValue
                .split(",")
                .map((s) => s.trim().toUpperCase())
                .filter(
                  (code) =>
                    Boolean(code) && !Object.keys(timetable).includes(code)
                )
              ;(async () => {
                const failed: string[] = []
                for (const code of codes) {
                  const ok = await handleSelect(code)
                  if (!ok) failed.push(code)
                }
                setInputValue(failed.join(", "))
              })()
            }
          }}
        />

        <CommandList className={cn(isModuleWindowOpen && "border-t")}>
          {searchResults.length === 0 &&
            inputValue.length !== 0 &&
            !isBulkInput && (
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
