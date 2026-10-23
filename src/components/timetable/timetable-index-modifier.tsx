"use client"

import { Fragment, useEffect, useRef, useState } from "react"
import { useBoundState } from "@/state/bound.state"
import { useIndexHover } from "@/state/index-hover.state"
import { Check } from "lucide-react"

import { track } from "@/lib/analytics"
import { getIndexType } from "@/lib/get-index-type"
import { getIndexTypeStyle } from "@/lib/get-index-type-style"
import { DAY_MAP } from "@/lib/module-constants"
import { latestSemester, latestYear } from "@/lib/semesters"
import { cn } from "@/lib/utils"
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
  DrawerContent,
  DrawerDescription,
  DrawerNestedRoot,
  DrawerTitle,
  DrawerTrigger
} from "../ui/drawer"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Textarea } from "../ui/textarea"
import { ToggleGroup, ToggleGroupItem } from "../ui/toggle-group"
import InfoTip from "./info-tip"

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

interface TimetableIndexNoteProps {
  moduleKey: string
  indexKey: string
}

/**
 * A note defaults to being tied to the currently selected index (most
 * notes are index-specific — "bring laptop" for a particular lab group),
 * with an escape hatch to widen it to every index of the module.
 *
 * Every keystroke writes straight to the store — no local draft, no
 * save-on-blur. A popover can close in ways that never fire blur (Escape,
 * for one), and a note is throwaway enough that losing it silently on
 * dismiss would be worse than a few extra store writes.
 */
const TimetableIndexNote = ({
  moduleKey,
  indexKey
}: TimetableIndexNoteProps) => {
  const moduleRemark = useBoundState((s) => s.moduleRemarks[moduleKey] ?? "")
  const indexRemark = useBoundState(
    (s) => s.indexRemarks[`${moduleKey}:${indexKey}`] ?? ""
  )
  const setModuleRemark = useBoundState((s) => s.setModuleRemark)
  const setIndexRemark = useBoundState((s) => s.setIndexRemark)

  const [scope, setScope] = useState<"index" | "module">(
    moduleRemark && !indexRemark ? "module" : "index"
  )

  // Only re-derive scope when the row itself changes — not on every
  // keystroke, or toggling to "module" while the note is still empty
  // would immediately flip back to "index" (empty moduleRemark looks
  // indistinguishable from "not module-scoped" otherwise).
  useEffect(() => {
    setScope(moduleRemark && !indexRemark ? "module" : "index")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleKey, indexKey])

  const value = scope === "module" ? moduleRemark : indexRemark

  const handleChange = (val: string) => {
    if (scope === "module") setModuleRemark(moduleKey, val)
    else setIndexRemark(moduleKey, indexKey, val)
  }

  const changeScope = (raw: string) => {
    // ToggleGroup (single) deselects on re-click, emitting "" — a
    // radio-style either/or has no unselected state, so ignore that.
    if (raw !== "index" && raw !== "module") return
    const nextScope = raw
    if (nextScope === scope) return

    if (nextScope === "module") {
      setModuleRemark(moduleKey, value)
      if (indexRemark) setIndexRemark(moduleKey, indexKey, "")
    } else {
      setIndexRemark(moduleKey, indexKey, value)
      if (moduleRemark) setModuleRemark(moduleKey, "")
    }

    setScope(nextScope)
    track("remark_scope_toggled", {
      module_code: moduleKey,
      scope: nextScope
    })
  }

  return (
    <div
      className="space-y-1 border-t px-3 py-2 pb-4 sm:pb-2"
      onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center">
          <label className="text-muted-foreground text-xs">Note</label>
          <InfoTip>
            Add a reminder for this class, like &quot;bring laptop&quot;. Only
            you see it, and it is saved on this device.
          </InfoTip>
        </span>

        <ToggleGroup
          type="single"
          size="sm"
          variant="outline"
          value={scope}
          onValueChange={changeScope}
          className="text-xs">
          {/* The outline variant's hover:bg-accent is identical to
             data-[state=on]:bg-accent — hovering the unselected option
             would make it look selected too. Give hover a distinct,
             lighter colour so which one is actually active stays clear. */}
          <ToggleGroupItem
            value="index"
            className="hover:bg-muted hover:text-foreground data-[state=on]:hover:bg-accent data-[state=on]:hover:text-accent-foreground h-6 px-2 text-xs">
            This index
          </ToggleGroupItem>
          <ToggleGroupItem
            value="module"
            className="hover:bg-muted hover:text-foreground data-[state=on]:hover:bg-accent data-[state=on]:hover:text-accent-foreground h-6 px-2 text-xs">
            All indexes
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <Textarea
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        maxLength={200}
        placeholder="e.g. bring laptop, seat near the door"
        // Stay at the default 16px on mobile — anything smaller triggers
        // iOS Safari's auto-zoom on focus. Only shrink on desktop.
        className="min-h-10 sm:text-xs md:text-xs"
      />
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
  const { indexes: seasonIndexes } = useSeasonIndexes(
    latestYear,
    latestSemester
  )
  const [indexes, setIndexes] = useState<Indexes>({})
  const [filteredIndexes, setFilteredIndexes] = useState<Indexes>({})
  const { isMobile } = useSettings()
  const { timetable, updateItemIndex } = useTimetable()
  const containerRef = useRef<HTMLDivElement>(null)
  const setHovered = useIndexHover((s) => s.setHovered)

  // Drop the preview when the picker closes or this row unmounts.
  useEffect(() => {
    if (!open) setHovered(null)
    return () => setHovered(null)
  }, [open, setHovered])

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
    track("timetable_index_changed", {
      module_code: moduleKey,
      index_key: val
    })
    if (isMobile) onOpenChange("")
  }

  const currentIndexKey = timetable[moduleKey]

  const items = (
    <div
      className="flex h-full min-h-0 flex-col overflow-hidden"
      // Desktop caps to the popover's available height so it never
      // overflows the viewport. Mobile has no such cap — it should fill
      // the drawer, so the note below the list lands at the actual
      // bottom instead of floating right under a short list.
      style={
        isMobile
          ? undefined
          : {
              maxHeight:
                "min(32rem, var(--radix-popover-content-available-height, 32rem))"
            }
      }>
      <Command
        shouldFilter={false}
        className="bg-muted/60 min-h-0 flex-1 border md:rounded-t-none">
        <div className="h-fit w-full border-b">
          <CommandInput
            placeholder="Search for code, timing or tutorial group"
            onValueChange={handleSearch}
          />
        </div>

        {hasCommonLecture && (
          <div className="w-full shrink-0 space-y-1 border-b px-3 py-2 text-sm">
            <p className="text-muted-foreground flex items-center justify-center text-xs">
              Common Lecture for Indexes
              <InfoTip>
                A lecture every index of this module shares. It stays the same
                whichever index you pick.
              </InfoTip>
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

        {/* max-h-none — cmdk's own default caps this at 300px, which left
            dead space below a short list instead of the list filling the
            flex-1 height we actually gave it. */}
        <CommandList className="max-h-none min-h-0 flex-1 overflow-y-auto">
          {Object.entries(filteredIndexes).map(([indexKey, slots]) => {
            const active = timetable[moduleKey] === indexKey

            return (
              <Fragment key={indexKey}>
                <CommandItem
                  value={indexKey}
                  onSelect={handleSelect}
                  onMouseEnter={() =>
                    !isMobile &&
                    setHovered({
                      moduleKey,
                      indexKey,
                      currentKey: currentIndexKey
                    })
                  }
                  onMouseLeave={() => setHovered(null)}
                  className="hover:bg-accent cursor-pointer transition-colors">
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

      {currentIndexKey && (
        <TimetableIndexNote moduleKey={moduleKey} indexKey={currentIndexKey} />
      )}
    </div>
  )

  if (isMobile)
    return (
      // Always opened from a row inside the mobile modifier drawer — must
      // nest under it (DrawerNestedRoot), a plain Drawer here would fight
      // the parent drawer for the drag gesture and never open correctly.
      <DrawerNestedRoot
        open={open}
        onOpenChange={(open) =>
          open ? onOpenChange(moduleKey) : onOpenChange("")
        }>
        <DrawerTrigger asChild>{props.children}</DrawerTrigger>

        <DrawerContent
          // vaul's default 500ms slide reads as sluggish for a row tap
          // that used to open an instant popover — cut it to feel snappier.
          className="border-primary h-[calc(100svh-6rem)] overflow-hidden p-2 !duration-150 focus:outline-none data-[vaul-drawer-direction=bottom]:mt-24 data-[vaul-drawer-direction=bottom]:max-h-[calc(100svh-6rem)] data-[vaul-drawer-direction=bottom]:rounded-t-3xl data-[vaul-drawer-direction=bottom]:border-4 data-[vaul-drawer-direction=bottom]:border-b-0">
          <DrawerTitle className="sr-only">Select module index</DrawerTitle>
          <DrawerDescription className="sr-only">
            Search and select an index for {moduleKey}.
          </DrawerDescription>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {items}
          </div>
        </DrawerContent>
      </DrawerNestedRoot>
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
          className="border-primary/50 bg-muted rounded-t-none border p-0 shadow-xl"
          align="start"
          sideOffset={0}
          style={{
            // The row's own width, which is the width of its highlight.
            width: containerRef.current?.clientWidth || "auto"
          }}>
          {items}
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default TimetableIndexModifier
