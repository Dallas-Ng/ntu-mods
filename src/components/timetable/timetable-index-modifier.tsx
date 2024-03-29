"use client"

import { Fragment, useRef, useState } from "react"
import { Check } from "lucide-react"

import { DAY_MAP } from "@/lib/constants"
import { getIndexType } from "@/lib/get-index-type"
import { getIndexTypeStyle } from "@/lib/get-index-type-style"
import { getModuleIndexes } from "@/lib/get-module-indexes"
import { cn } from "@/lib/utils"
import { useSettings } from "@/hooks/use-settings"
import { useTimetable } from "@/hooks/use-timetable"

import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList
} from "../ui/command"
import { Drawer, DrawerContent, DrawerTrigger } from "../ui/drawer"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"

const IndexCommandItem = ({ index }: { index: Index }) => {
  const indexStyle = getIndexTypeStyle(index.type)

  return (
    <div>
      <div className="flex w-full justify-between gap-2 ">
        <span>{DAY_MAP[index.day as keyof typeof DAY_MAP]}</span>

        <span className={cn(indexStyle.textAlt, "font-semibold")}>
          {getIndexType(index.type)} - {index.group}
        </span>
      </div>

      <div className="flex w-full justify-between gap-2 text-xs text-muted-foreground">
        <span>{index.time}</span>
        <span>{index.venue}</span>
      </div>
    </div>
  )
}

interface Props {
  moduleKey: string
  children: React.ReactNode
  onOpenChange: (moduleKey: string) => void
}

const TimetableIndexModifier = (props: Props) => {
  const { moduleKey, onOpenChange } = props
  const indexes = getModuleIndexes(moduleKey)
  const { isMobile } = useSettings()
  const { timetable, updateItemIndex } = useTimetable()
  const containerRef = useRef<HTMLDivElement>(null)
  const [filteredIndexes, setFilteredIndexes] = useState(indexes)

  const randomLecture =
    Object.values(indexes)
      .find((index) => index.some((item) => getIndexType(item.type) === "LEC"))
      ?.filter((x) => getIndexType(x.type) === "LEC") || []

  const moduleLectures = Object.values(indexes)
    .flat()
    .filter((index) => getIndexType(index.type) === "LEC")

  const hasCommonLecture =
    moduleLectures.length > 0 && randomLecture.length > 0
      ? moduleLectures.every((item) =>
          randomLecture.some((x) => x.day === item.day && x.time === item.time)
        )
      : false

  const handleSearch = (val: string) => {
    const searchTerm = val.toLowerCase()
    if (searchTerm === "") return setFilteredIndexes(indexes)

    const temp: Indexes = {}

    for (const [ciKey, ciVal] of Object.entries(indexes)) {
      const keyMatches = ciKey.toLowerCase().includes(searchTerm)
      const valueMatches = ciVal.some((item) =>
        Object.entries(item).some(([itemKey, itemVal]) =>
          typeof itemVal === "string"
            ? itemVal.toLowerCase().includes(searchTerm)
            : // means itemVal is a number
              itemKey != "duration" && // duration is also a number, so dont use it to filter days
              DAY_MAP[itemVal as keyof typeof DAY_MAP]
                .toLowerCase()
                .includes(searchTerm)
        )
      )

      if (keyMatches || valueMatches) temp[ciKey] = ciVal
    }

    setFilteredIndexes(temp)
  }

  const handleSelect = (val: string) => {
    updateItemIndex(moduleKey, val)
  }

  const items = (
    <Command shouldFilter={false} className="border md:rounded-t-none">
      <div className="h-fit w-full border-b">
        <CommandInput
          placeholder="Search for code, timing or tutorial group"
          onValueChange={handleSearch}
        />
      </div>

      {hasCommonLecture && (
        <div className="w-full space-y-2 border-b px-4 py-2 text-sm md:py-4">
          <p className="text-center text-xs text-muted-foreground">
            Common Lecture for Indexes
          </p>

          {randomLecture.map((index, idx) => (
            <IndexCommandItem key={idx} index={index} />
          ))}
        </div>
      )}

      {Object.keys(filteredIndexes).length > 0 && (
        <div className="sticky top-0 z-20 flex w-full items-center gap-2 border-b bg-background p-1 text-xs">
          <div className="flex gap-1">
            <span className="w-4" />
            <span className="w-[43px] text-center">Code</span>
          </div>

          <span className="w-full">Day / Time</span>
          <span className="whitespace-nowrap text-end">Group / Venue</span>
        </div>
      )}

      <CommandEmpty>No indexes code found</CommandEmpty>

      <CommandList className="max-h-full md:max-h-[28rem]">
        {Object.entries(filteredIndexes).map(([indexKey, indexes]) => {
          const active = timetable[moduleKey] === indexKey

          return (
            <Fragment key={indexKey}>
              <CommandItem
                value={indexKey}
                onSelect={handleSelect}
                className="rounded-none transition-colors hover:cursor-pointer hover:bg-accent">
                <div className="flex w-full justify-between gap-2 text-sm">
                  <span className="flex items-center gap-1">
                    <Check
                      className={cn(
                        "inline size-4",
                        active ? "opacity-100" : "opacity-0"
                      )}
                    />

                    {indexKey}
                  </span>

                  {/* Dont remove this flex-col, there can be multiple timeslots for 1 index (e.g. lab, tutorial, lecture) */}
                  <div className="flex w-full flex-col gap-1">
                    {indexes.map((index, i) => {
                      if (
                        hasCommonLecture &&
                        getIndexType(index.type) === "LEC"
                      )
                        return null

                      return <IndexCommandItem key={i} index={index} />
                    })}
                  </div>
                </div>
              </CommandItem>

              <hr />
            </Fragment>
          )
        })}
      </CommandList>
    </Command>
  )

  if (isMobile)
    return (
      <Drawer
        onOpenChange={(open) =>
          open ? onOpenChange(moduleKey) : onOpenChange("")
        }>
        <DrawerTrigger asChild>{props.children}</DrawerTrigger>

        <DrawerContent className="h-full max-h-[85svh] p-2">
          {items}
        </DrawerContent>
      </Drawer>
    )

  return (
    <div ref={containerRef}>
      <Popover
        onOpenChange={(open) =>
          open ? onOpenChange(moduleKey) : onOpenChange("")
        }>
        <PopoverTrigger asChild type={undefined}>
          {props.children}
        </PopoverTrigger>

        <PopoverContent
          container={containerRef.current}
          className="border-none"
          sideOffset={0}
          style={{
            width: containerRef.current?.clientWidth
              ? containerRef.current.clientWidth + 4 // border width
              : "auto"
          }}>
          {items}
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default TimetableIndexModifier
