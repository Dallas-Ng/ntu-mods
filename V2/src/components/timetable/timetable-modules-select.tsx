"use client"

import { useEffect, useRef, useState } from "react"
import { M_INDEXES } from "@/data/2023/m-indexes"
import { TRUN_M_DATA } from "@/data/2023/trun-m-data"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"
import { useTimetable } from "@/hooks/use-timetable"
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command"

import { Button } from "../ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"

const STORED_KEYS = Object.keys(TRUN_M_DATA)

const TimetableModulesSelect = () => {
  const [inputValue, setInputValue] = useState("")
  const [moduleCodes, setModuleCodes] = useState<string[]>([])
  const [windowOpen, setWindowOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const { timetable, addItemToTimetable } = useTimetable()

  const dbSearchTerm = useDebounce(inputValue, 200) // arbitrary delay - anything lower makes it feel laggy

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

    const indexes = M_INDEXES[moduleKey]
    const firstIndexKey = Object.keys(indexes)[0]

    //CHeck for conlifct here

    addItemToTimetable(moduleKey, firstIndexKey)
  }

  return (
    <div ref={containerRef} className="h-min w-full">
      <Popover open={windowOpen} onOpenChange={setWindowOpen}>
        <PopoverTrigger type={undefined} asChild>
          <Button variant="outline" className="w-full">
            Click to Add Mods
            <ChevronsUpDown className="ml-1 h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>

        <PopoverContent
          container={containerRef.current}
          className="w-full p-1"
          style={{ width: containerRef.current?.clientWidth }}>
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search for a module.."
              value={inputValue}
              onValueChange={(v) => setInputValue(v)}
            />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>

              {moduleCodes.map((moduleKey) => {
                const isActive = Object.keys(timetable).find(
                  (x) => x === moduleKey
                )

                return (
                  <CommandItem
                    key={moduleKey}
                    value={moduleKey}
                    onSelect={handleSelect}
                    className="cursor-pointer py-3 md:py-2">
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isActive ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {moduleKey}
                  </CommandItem>
                )
              })}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default TimetableModulesSelect
