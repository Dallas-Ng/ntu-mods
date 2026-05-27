"use client"

import { Fragment, useEffect, useRef, useState } from "react"
import { Check } from "lucide-react"
import posthog from "posthog-js"

import { DAY_MAP } from "@/lib/constants"
import { getIndexType } from "@/lib/get-index-type"
import { getIndexTypeStyle } from "@/lib/get-index-type-style"
import { cn } from "@/lib/utils"
import { useLatestSemester } from "@/hooks/use-latest-semester"
import { useSeasonIndexes } from "@/hooks/use-season-indexes"
import { useSettings } from "@/hooks/use-settings"
import { useTimetable } from "@/hooks/use-timetable"

import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList
} from "../ui/command"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger
} from "../ui/drawer"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"

type Indexes = Record<string, Index[]>

const IndexCommandItem = ({ index }: { index: Index }) => {
  const indexStyle = getIndexTypeStyle(index.type)
  const isOnline = !index.day || index.day === 0

  return (
    <div>
      <div className="flex w-full justify-between gap-2">
        <span>
          {isOnline ? "Online" : (DAY_MAP as Record<number, string>)[index.day]}
        </span>

        <span className={cn(indexStyle.textAlt, "font-semibold")}>
          {getIndexType(index.type)} - {index.group}
        </span>
      </div>

      <div className="text-muted-foreground flex w-full justify-between gap-2 text-xs">
        <span>{isOnline ? "No scheduled timeslot" : index.time}</span>
        <span>{index.venue}</span>
      </div>
    </div>
  )
}

interface Props {
  moduleKey: string
  open?: boolean
  children: React.ReactNode
  onOpenChange: (moduleKey: string) => void
}

const TimetableIndexModifier = (props: Props) => {
  const { moduleKey, onOpenChange, open = false } = props
  const { year, semester } = useLatestSemester()
  const { indexes: seasonIndexes } = useSeasonIndexes(year, semester)
  const [indexes, setIndexes] = useState<Indexes>({})
  const [filteredIndexes, setFilteredIndexes] = useState<Indexes>({})
  const { isMobile } = useSettings()
  const { timetable, updateItemIndex } = useTimetable()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const raw: Indexes = (seasonIndexes[moduleKey] as Indexes) ?? {}
    setIndexes(raw)
    setFilteredIndexes(raw)
  }, [moduleKey, seasonIndexes])

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
              (DAY_MAP as Record<number, string>)[itemVal]
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
    posthog.capture("timetable_index_changed", {
      module_code: moduleKey,
      index_key: val
    })
    if (isMobile) onOpenChange("")
  }

  const items = (
    <Command
      shouldFilter={false}
      className="h-full min-h-0 border md:rounded-t-none">
      <div className="h-fit w-full border-b">
        <CommandInput
          placeholder="Search for code, timing or tutorial group"
          onValueChange={handleSearch}
        />
      </div>

      {hasCommonLecture && (
        <div className="w-full space-y-2 border-b px-4 py-2 text-sm md:py-4">
          <p className="text-muted-foreground text-center text-xs">
            Common Lecture for Indexes
          </p>

          {randomLecture.map((index, idx) => (
            <IndexCommandItem key={idx} index={index} />
          ))}
        </div>
      )}

      {Object.keys(filteredIndexes).length > 0 && (
        <div className="bg-background sticky top-0 z-20 flex w-full items-center gap-2 border-b p-1 text-xs">
          <div className="flex gap-1">
            <span className="w-4" />
            <span className="w-[43px] text-center">Code</span>
          </div>

          <span className="w-full">Day / Time</span>
          <span className="text-end whitespace-nowrap">Group / Venue</span>
        </div>
      )}

      <CommandEmpty>No indexes code found</CommandEmpty>

      <CommandList className="max-h-none min-h-0 flex-1 overflow-y-auto md:max-h-[28rem]">
        {Object.entries(filteredIndexes).map(([indexKey, slots]) => {
          const active = timetable[moduleKey] === indexKey

          return (
            <Fragment key={indexKey}>
              <CommandItem
                value={indexKey}
                onSelect={handleSelect}
                className="hover:bg-accent rounded-none transition-colors hover:cursor-pointer">
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
                    {slots.map((index, i) => {
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
        open={open}
        onOpenChange={(open) =>
          open ? onOpenChange(moduleKey) : onOpenChange("")
        }>
        <DrawerTrigger asChild>{props.children}</DrawerTrigger>

        <DrawerContent className="border-primary h-[calc(100svh-6rem)] overflow-hidden p-2 focus:outline-none data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[calc(100svh-6rem)] data-[vaul-drawer-direction=bottom]:rounded-t-3xl data-[vaul-drawer-direction=bottom]:border-4 data-[vaul-drawer-direction=bottom]:border-b-0">
          <DrawerTitle className="sr-only">Select module index</DrawerTitle>
          <DrawerDescription className="sr-only">
            Search and select an index for {moduleKey}.
          </DrawerDescription>

          <div className="mt-5 flex min-h-0 flex-1 flex-col overflow-hidden">
            {items}
          </div>
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
          className="rounded-t-none border p-0"
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
