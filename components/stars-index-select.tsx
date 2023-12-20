"use client"

import { useEffect, useRef, useState } from "react"
import { useBoundState } from "@/state/bound-state"
import { Check } from "lucide-react"

import { C_DATA } from "@/lib/consolidated-data"
import { DAY_MAPPING, cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem
} from "@/components/ui/command"

import { Button } from "./ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"

interface Props {
  courseKey: string
}

export default function StarsIndexSelect({ courseKey }: Props) {
  const [popoverOpen, setPopoverOpen] = useState(false)
  const { coursesToIndex, addCourseToIndex, removeCourseToIndex } =
    useBoundState()
  const containerRef = useRef<HTMLDivElement>(null)

  const course: Course = C_DATA[courseKey as keyof typeof C_DATA]
  const courseIndexes = course ? course.indexes : ([] as unknown as CourseIndex)
  const [filteredIndexes, setFilteredIndexes] =
    useState<CourseIndex>(courseIndexes)

  useEffect(() => {
    if (!popoverOpen) {
      handleSearch("")
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [popoverOpen])

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
              DAY_MAPPING[itemVal as keyof typeof DAY_MAPPING]
                .toLowerCase()
                .includes(lSearchTerm)
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
      addCourseToIndex(
        courseKey,
        courseIndexes[idxKey as keyof typeof courseIndexes]
      )
    }
  }

  return (
    <div ref={containerRef}>
      <Popover onOpenChange={(v) => setPopoverOpen(v)}>
        <PopoverTrigger>
          <Button variant="outline" className="w-full px-6 text-sm">
            {coursesToIndex[courseKey][0].key}
          </Button>
        </PopoverTrigger>

        <PopoverContent
          className="w-[100vw] p-0 md:w-96"
          container={containerRef.current}>
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Search index, preferred timing or tutorial group"
              onValueChange={handleSearch}
            />

            <CommandEmpty>No indexes code found</CommandEmpty>

            <CommandGroup className="relative max-h-[400px] overflow-auto p-0 px-1">
              {Object.keys(filteredIndexes).length > 0 && (
                <div className="sticky top-[0px] z-[20] flex w-full items-center bg-popover pb-1 text-xs">
                  <span className="w-[200px] text-center">Code</span>

                  <span className="w-full">Day / Time</span>
                  <span className="whitespace-nowrap text-end">
                    Group / Venue
                  </span>
                </div>
              )}

              {Object.entries(filteredIndexes).map(([idxKey, fiValue]) => (
                <CommandItem
                  key={idxKey}
                  value={idxKey}
                  onSelect={handleSelect}
                  className="mb-1 cursor-pointer">
                  <div className="flex w-full justify-between gap-6">
                    <span className="flex items-center">
                      <Check
                        className={cn(
                          "mr-2 inline h-4 w-4",
                          Object.values(coursesToIndex).find(
                            (v) => v[0].key === idxKey
                          )
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                      {idxKey}
                    </span>

                    {/* Dont remove this flex-col, there can be multiple timeslots for 1 index (e.g. lab, tutorial, lecture) */}
                    <div className="flex w-full flex-col gap-1">
                      {fiValue.map((v, i) => (
                        <div key={i}>
                          <div className="flex w-full justify-between gap-2">
                            <span>
                              {DAY_MAPPING[v.day as keyof typeof DAY_MAPPING]}
                            </span>

                            <span>
                              {v.type} - {v.group}
                            </span>
                          </div>

                          <div className="flex w-full justify-between gap-2">
                            <span>{v.time}</span>
                            <span>{v.venue}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
