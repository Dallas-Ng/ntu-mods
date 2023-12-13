"use client"

import { useState } from "react"
import { useBoundState } from "@/state/bound-state"
import { Check } from "lucide-react"

import { getCDataCourseIndexes } from "@/lib/consolidated-data"
import { DAY_MAP, DEF_SCROLLBAR, cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem
} from "@/components/ui/command"

import { Icons } from "./icons"
import { Badge } from "./ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"

interface Props {
  courseKey: string
  children?: React.ReactNode
}

export default function StarsCourseBadge({ courseKey, children }: Props) {
  const [popoverOpen, setPopoverOpen] = useState(false)
  const {
    coursesToIndex,
    addCourseToIndex,
    removeCourseToIndex,
    removeCourse
  } = useBoundState()
  const courseIndexes = getCDataCourseIndexes(courseKey)
  const [filteredIndexes, setFilteredIndexes] =
    useState<CourseIndex>(courseIndexes)

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
              DAY_MAP[itemVal as keyof typeof DAY_MAP]
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
      removeCourseToIndex(courseKey, idxKey)
    } else {
      addCourseToIndex(courseKey, idxKey)
    }
  }

  return (
    <Popover onOpenChange={(v) => setPopoverOpen(v)}>
      <PopoverTrigger>
        <div className="flex h-[40px] items-center md:h-fit">
          <Badge
            className={cn(
              "flex items-center justify-between gap-1 hover:bg-gradient-to-r hover:from-blue-800 hover:to-indigo-900 hover:text-white",
              popoverOpen &&
                "bg-gradient-to-r from-blue-800 to-indigo-900 text-white "
            )}>
            {children}
            <span
              onClick={(e) => {
                e.preventDefault()
                removeCourse(courseKey)
              }}
              className="ml-1">
              <Icons.xIcon height={20} width={20} />
            </span>
          </Badge>
        </div>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search index, preferred timing or tutorial group"
            onValueChange={handleSearch}
          />

          <CommandEmpty>No indexes code found</CommandEmpty>

          <CommandGroup
            className={cn("max-h-[400px] overflow-auto", DEF_SCROLLBAR)}>
            {Object.keys(filteredIndexes).length > 0 && (
              <div className="sticky top-[-4px] z-10 flex w-full items-center bg-popover pb-1 text-xs">
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
                        coursesToIndex[courseKey] === idxKey
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
                          <span>{DAY_MAP[v.day as keyof typeof DAY_MAP]} </span>
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
  )
}
