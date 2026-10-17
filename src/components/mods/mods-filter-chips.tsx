"use client"

import { Check, ChevronDown, SlidersHorizontal } from "lucide-react"
import posthog from "posthog-js"

import { MODULE_CATEGORY, MODULE_FACULTY, TRUN_DAY_MAP } from "@/lib/constants"
import { parseFilterList } from "@/lib/filter-modules"
import { TIME_OPTIONS } from "@/lib/generation-config"
import { cn } from "@/lib/utils"
import { usePathname } from "@/hooks/use-pathname"
import { pushSearchParams, useSearchParams } from "@/hooks/use-search-params"
import { Button } from "@/components/ui/button"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger
} from "@/components/ui/drawer"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"

export type FacetKey = "moduleLevel" | "moduleType" | "moduleFaculty"

export const FILTER_KEYS = [
  "searchTerm",
  "moduleType",
  "moduleFaculty",
  "moduleLevel",
  "currentOnly",
  "moduleDay",
  "moduleTimeStart",
  "moduleTimeEnd"
]

interface Option {
  value: string
  label: string
}

const LEVEL_OPTIONS: Option[] = ["1", "2", "3", "4", "5", "6", "7"].map(
  (l) => ({ value: l, label: `${l}000 level` })
)

const TYPE_OPTIONS: Option[] = Object.entries(MODULE_CATEGORY)
  .filter(([k]) => k !== "USP")
  .map(([value, label]) => ({ value, label }))

const FACULTY_OPTIONS: Option[] = Object.entries(MODULE_FACULTY).map(
  ([value, name]) => ({ value, label: `${value} · ${name}` })
)

const DAYS = [1, 2, 3, 4, 5, 6, 7] as const

const FACETS: { key: FacetKey; label: string; options: Option[] }[] = [
  { key: "moduleLevel", label: "Level", options: LEVEL_OPTIONS },
  { key: "moduleType", label: "Type", options: TYPE_OPTIONS },
  { key: "moduleFaculty", label: "School", options: FACULTY_OPTIONS }
]

const FACET_ANALYTICS: Record<string, string> = {
  moduleLevel: "module_level",
  moduleType: "module_type",
  moduleFaculty: "faculty",
  moduleDay: "module_day",
  moduleTimeStart: "module_time_start",
  moduleTimeEnd: "module_time_end",
  currentOnly: "current_only"
}

export interface ModsFilterProps {
  moduleType: string
  moduleFaculty: string
  moduleLevel: string
  moduleDay: string
  moduleTimeStart: string
  moduleTimeEnd: string
  currentOnly: string
  /** Modules shown if only `value` were chosen for this facet. */
  countOption: (key: FacetKey, value: string) => number
  onClearAll?: () => void
}

/** Reads the filter values and writes changes to the URL. */
function useFilters(props: ModsFilterProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const setParam = (key: string, value: string, defaultValue = "all") => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === defaultValue || value === "") params.delete(key)
    else params.set(key, value)
    pushSearchParams(pathname, params.toString())
    posthog.capture(
      value === defaultValue || value === ""
        ? "mods_filter_cleared"
        : "mods_filter_applied",
      { filter_type: FACET_ANALYTICS[key] ?? key, value }
    )
  }

  const clearTime = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("moduleTimeStart")
    params.delete("moduleTimeEnd")
    pushSearchParams(pathname, params.toString())
    posthog.capture("mods_filter_cleared", { filter_type: "module_time" })
  }

  const values: Record<FacetKey, string> = {
    moduleLevel: props.moduleLevel,
    moduleType: props.moduleType,
    moduleFaculty: props.moduleFaculty
  }
  const days = parseFilterList(props.moduleDay).map(Number)
  const timeFrom = props.moduleTimeStart !== "all" ? props.moduleTimeStart : ""
  const timeTo = props.moduleTimeEnd !== "all" ? props.moduleTimeEnd : ""
  const timeLabel = (v: string) =>
    TIME_OPTIONS.find((t) => String(t.value) === v)?.label ?? v
  const timeSummary =
    timeFrom && timeTo
      ? `${timeLabel(timeFrom)}–${timeLabel(timeTo)}`
      : timeFrom
        ? `after ${timeLabel(timeFrom)}`
        : timeTo
          ? `before ${timeLabel(timeTo)}`
          : ""
  const daySummary = days
    .map((d) => TRUN_DAY_MAP[d as keyof typeof TRUN_DAY_MAP])
    .join(", ")

  return {
    setParam,
    clearTime,
    values,
    days,
    timeFrom,
    timeTo,
    timeSummary,
    daySummary,
    semesterOnly: props.currentOnly === "true"
  }
}

type Filters = ReturnType<typeof useFilters>

/** Desktop: one row of chips, each opening a small menu. */
export const ModsFilterChips = (props: ModsFilterProps) => {
  const f = useFilters(props)

  return (
    <div className="flex flex-wrap gap-2">
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
        label={f.days.length > 0 ? `Days: ${f.daySummary}` : "Days"}
        active={f.days.length > 0}>
        <DaysPicker
          days={f.days}
          onChange={(next) => f.setParam("moduleDay", next.join(","))}
        />
      </FilterChip>

      <FilterChip
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

/** Mobile: a single Filters button that opens every filter in a bottom drawer. */
export const ModsFilterDrawer = ({
  resultCount,
  ...props
}: ModsFilterProps & { resultCount: number }) => {
  const f = useFilters(props)

  const activeCount = [
    ...FACETS.map(({ key }) => parseFilterList(f.values[key]).length > 0),
    f.days.length > 0,
    Boolean(f.timeSummary),
    !f.semesterOnly
  ].filter(Boolean).length

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 shrink-0 gap-1.5">
          <SlidersHorizontal className="size-3.5" />
          Filters
          {activeCount > 0 && (
            <span className="bg-primary text-primary-foreground flex size-4 items-center justify-center rounded-full text-[10px] font-medium">
              {activeCount}
            </span>
          )}
        </Button>
      </DrawerTrigger>

      <DrawerContent className="max-h-[85svh] data-[vaul-drawer-direction=bottom]:max-h-[85svh]">
        <DrawerTitle className="sr-only">Filters</DrawerTitle>
        <DrawerDescription className="sr-only">
          Narrow the module list by level, type, school, days and time.
        </DrawerDescription>

        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <h2 className="text-base font-semibold">Filters</h2>
          {props.onClearAll && (
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground cursor-pointer text-sm"
              onClick={props.onClearAll}>
              Clear all
            </button>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4">
          <label className="flex cursor-pointer items-center gap-3 border-b py-3 text-sm font-medium">
            <Checkbox
              checked={f.semesterOnly}
              onChange={() =>
                f.setParam(
                  "currentOnly",
                  f.semesterOnly ? "false" : "true",
                  "true"
                )
              }
            />
            This semester only
          </label>

          {FACETS.map(({ key, label, options }) => {
            const selected = parseFilterList(f.values[key])
            return (
              <DrawerSection
                key={key}
                title={label}
                summary={summarise(key, selected, options)}
                defaultOpen={key !== "moduleFaculty"}>
                <FacetOptions
                  facet={key}
                  options={options}
                  selected={selected}
                  countOption={props.countOption}
                  onChange={(next) => f.setParam(key, next.join(","))}
                  className={
                    key === "moduleFaculty" ? "max-h-60" : "max-h-none"
                  }
                />
              </DrawerSection>
            )
          })}

          <DrawerSection title="Class days" summary={f.daySummary}>
            <DaysPicker
              days={f.days}
              onChange={(next) => f.setParam("moduleDay", next.join(","))}
            />
          </DrawerSection>

          <DrawerSection title="Class times" summary={f.timeSummary}>
            <TimePicker
              from={props.moduleTimeStart}
              to={props.moduleTimeEnd}
              onChange={f.setParam}
              onClear={f.timeSummary ? f.clearTime : undefined}
            />
          </DrawerSection>
        </div>

        <div className="border-t p-4">
          <DrawerClose asChild>
            <Button className="w-full">
              {resultCount === 0
                ? "No modules match"
                : `Show ${resultCount} module${resultCount === 1 ? "" : "s"}`}
            </Button>
          </DrawerClose>
        </div>
      </DrawerContent>
    </Drawer>
  )
}

const ACTIVE =
  "bg-foreground text-background hover:bg-foreground/90 hover:text-background dark:bg-foreground dark:hover:bg-foreground/90 border-transparent dark:border-transparent"

function summarise(key: FacetKey, selected: string[], options: Option[]) {
  if (selected.length === 0) return ""
  if (selected.length > 2) return `${selected.length} selected`
  return selected
    .map((v) => {
      if (key === "moduleLevel") return `${v}000`
      if (key === "moduleFaculty") return v
      return options.find((o) => o.value === v)?.label ?? v
    })
    .join(", ")
}

function Checkbox({
  checked,
  onChange
}: {
  checked: boolean
  onChange: () => void
}) {
  return (
    <>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={onChange}
      />
      <span
        aria-hidden="true"
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded border",
          checked && "bg-foreground text-background border-transparent"
        )}>
        {checked && <Check className="size-3" />}
      </span>
    </>
  )
}

function FacetOptions({
  facet,
  options,
  selected,
  countOption,
  onChange,
  className
}: {
  facet: FacetKey
  options: Option[]
  selected: string[]
  countOption: (key: FacetKey, value: string) => number
  onChange: (next: string[]) => void
  className?: string
}) {
  return (
    <div className={cn("max-h-72 overflow-y-auto", className)}>
      {options.map((o) => {
        const on = selected.includes(o.value)
        const n = countOption(facet, o.value)
        return (
          <button
            key={o.value}
            type="button"
            role="checkbox"
            aria-checked={on}
            className="hover:bg-accent flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors"
            onClick={() =>
              onChange(
                on
                  ? selected.filter((v) => v !== o.value)
                  : [...selected, o.value]
              )
            }>
            <span
              aria-hidden="true"
              className={cn(
                "flex size-4 shrink-0 items-center justify-center rounded border",
                on && "bg-foreground text-background border-transparent"
              )}>
              {on && <Check className="size-3" />}
            </span>
            <span className="min-w-0 flex-1 truncate">{o.label}</span>
            <span
              className={cn(
                "text-muted-foreground text-xs tabular-nums",
                n === 0 && "opacity-40"
              )}>
              {n}
            </span>
          </button>
        )
      })}
      {selected.length > 0 && <ClearLink onClick={() => onChange([])} />}
    </div>
  )
}

function DaysPicker({
  days,
  onChange
}: {
  days: number[]
  onChange: (next: number[]) => void
}) {
  return (
    <>
      <p className="text-muted-foreground px-1 pb-2 text-xs">
        Only show modules with an index held on these days.
      </p>
      <div className="flex flex-wrap gap-1.5 px-1">
        {DAYS.map((d) => {
          const on = days.includes(d)
          return (
            <button
              key={d}
              type="button"
              aria-pressed={on}
              className={cn(
                "h-8 min-w-11 cursor-pointer rounded-md border px-2 text-sm font-medium transition-colors",
                on
                  ? "bg-foreground text-background border-transparent"
                  : "text-muted-foreground hover:border-foreground hover:text-foreground"
              )}
              onClick={() =>
                onChange(on ? days.filter((x) => x !== d) : [...days, d].sort())
              }>
              {TRUN_DAY_MAP[d as keyof typeof TRUN_DAY_MAP]}
            </button>
          )
        })}
      </div>
      {days.length > 0 && <ClearLink onClick={() => onChange([])} />}
    </>
  )
}

function TimePicker({
  from,
  to,
  onChange,
  onClear
}: {
  from: string
  to: string
  onChange: Filters["setParam"]
  onClear?: () => void
}) {
  return (
    <>
      <p className="text-muted-foreground px-1 pb-2 text-xs">
        Only show modules whose classes all fit inside this window.
      </p>
      <div className="flex items-center gap-2 px-1 text-sm">
        <TimeSelect
          label="From"
          value={from}
          onChange={(v) => onChange("moduleTimeStart", v)}
        />
        <TimeSelect
          label="to"
          value={to}
          onChange={(v) => onChange("moduleTimeEnd", v)}
        />
      </div>
      {onClear && <ClearLink onClick={onClear} />}
    </>
  )
}

function FilterChip({
  label,
  active,
  children
}: {
  label: string
  active: boolean
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
      <PopoverContent align="start" className="w-72 max-w-[90vw] p-2">
        {children}
      </PopoverContent>
    </Popover>
  )
}

function DrawerSection({
  title,
  summary,
  defaultOpen,
  children
}: {
  title: string
  summary?: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  return (
    <details open={defaultOpen} className="group border-b py-3">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium [&::-webkit-details-marker]:hidden">
        <span>{title}</span>
        <span className="text-muted-foreground flex min-w-0 items-center gap-2 text-xs font-normal">
          <span className="truncate">{summary}</span>
          <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" />
        </span>
      </summary>
      <div className="pt-2">{children}</div>
    </details>
  )
}

function ClearLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="text-muted-foreground hover:text-foreground mt-2 cursor-pointer px-1 text-xs transition-colors"
      onClick={onClick}>
      Clear
    </button>
  )
}

function TimeSelect({
  label,
  value,
  onChange
}: {
  label: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <label className="text-muted-foreground flex items-center gap-2">
      {label}
      <select
        className="border-input bg-background text-foreground h-8 rounded-md border px-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}>
        <option value="all">Any time</option>
        {TIME_OPTIONS.map((t) => (
          <option key={t.value} value={String(t.value)}>
            {t.label}
          </option>
        ))}
      </select>
    </label>
  )
}
