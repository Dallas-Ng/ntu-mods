"use client"

import { ChevronDown } from "lucide-react"

import { parseFilterList } from "@/lib/filter-modules"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"

import {
  ACTIVE,
  DaysPicker,
  FacetOptions,
  FACETS,
  summarise,
  TimePicker,
  useFilters,
  type ModsFilterProps
} from "./mods-filter-shared"

/** Desktop: one row of chips, each opening a small popover menu. */
export const ModsFilterChips = (props: ModsFilterProps) => {
  const f = useFilters(props)

  return (
    <div className="hidden flex-wrap gap-2 md:flex">
      {FACETS.map(({ key, label, options }) => {
        const selected = parseFilterList(f.values[key])
        const summary = summarise(key, selected, options)
        return (
          <FilterChip
            key={key}
            label={summary ? `${label}: ${summary}` : label}
            active={selected.length > 0}>
            <FacetOptions
              facet={key}
              options={options}
              selected={selected}
              countOption={props.countOption}
              onChange={(next) => f.setParam(key, next.join(","))}
            />
          </FilterChip>
        )
      })}

      <FilterChip
        wide
        label={f.days.length > 0 ? `Days: ${f.daySummary}` : "Days"}
        active={f.days.length > 0}>
        <DaysPicker
          days={f.days}
          onChange={(next) => f.setParam("moduleDay", next.join(","))}
        />
      </FilterChip>

      <FilterChip
        wide
        label={f.timeSummary ? `Time: ${f.timeSummary}` : "Time"}
        active={Boolean(f.timeSummary)}>
        <TimePicker
          from={props.moduleTimeStart}
          to={props.moduleTimeEnd}
          onChange={f.setParam}
          onClear={f.timeSummary ? f.clearTime : undefined}
        />
      </FilterChip>

      <Button
        variant="outline"
        size="sm"
        aria-pressed={f.semesterOnly}
        className={cn(
          "h-8 shrink-0 rounded-full px-3",
          f.semesterOnly && ACTIVE
        )}
        onClick={() =>
          f.setParam("currentOnly", f.semesterOnly ? "false" : "true", "true")
        }>
        This semester only
      </Button>

      {props.onClearAll && (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground h-8 rounded-full px-3"
          onClick={props.onClearAll}>
          Clear all
        </Button>
      )}
    </div>
  )
}

function FilterChip({
  label,
  active,
  wide,
  children
}: {
  label: string
  active: boolean
  /** Days and time need room for seven buttons and two pickers. */
  wide?: boolean
  children: React.ReactNode
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 max-w-full shrink-0 gap-1.5 rounded-full px-3",
            active && ACTIVE
          )}>
          <span className="truncate">{label}</span>
          <ChevronDown className="size-3 opacity-60" />
        </Button>
      </PopoverTrigger>
      {/* Focus the popover itself rather than its first control, which would
          show a focus ring as soon as it opens. Tab still moves inside. */}
      <PopoverContent
        align="start"
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          if (e.target instanceof HTMLElement) e.target.focus()
        }}
        className={cn("max-w-[90vw] p-2", wide ? "w-80" : "w-72")}>
        {children}
      </PopoverContent>
    </Popover>
  )
}
