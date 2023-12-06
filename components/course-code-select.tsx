"use client"

import { useEffect, useState } from "react"
import CONSOLIDATED_DATA from "@/data/consolidated-2023-2.json"
import { Check, ChevronsUpDown } from "lucide-react"

import { DEF_SCROLLBAR, cn } from "@/lib/utils"
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
  const [searchWindowOpen, setSearchWindowOpen] = useState(false)
  const [selectedCourse, setSelectedCourse] = useState<string>()
  const [inputValue, setInputValue] = useState<string>("")
  const [courseCodes, setCourseCode] = useState<string[]>([])

  const dbSearchTerm = useDebounce(inputValue, 150) // arbitrary delay

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

  return (
    <Popover open={searchWindowOpen} onOpenChange={setSearchWindowOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={searchWindowOpen}
          className="w-[200px] justify-between">
          {selectedCourse ?? "Select course code"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[200px] p-0">
        <Command>
          <CommandInput
            separator={courseCodes.length > 0}
            placeholder="Search course code"
            onValueChange={(v) => setInputValue(v)}
          />

          <CommandEmpty>No course code found</CommandEmpty>

          <CommandGroup
            className={cn(
              courseCodes.length > 0 ? "block" : "hidden",
              "max-h-[400px] overflow-auto",
              DEF_SCROLLBAR
            )}>
            {courseCodes.map((courseCode) => (
              <CommandItem
                key={courseCode}
                value={courseCode}
                onSelect={(currValue) => {
                  // .toUpperCase is needed as courseCode is auto lowercased when passed as
                  // prop into CommandItem
                  setSelectedCourse(currValue.toUpperCase())
                  setSearchWindowOpen(false)
                }}>
                {/* Show the check for selected items only */}
                {/* TODO: Include ALL checked items - right now only happens for 1 */}
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selectedCourse === courseCode ? "opacity-100" : "opacity-0"
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
