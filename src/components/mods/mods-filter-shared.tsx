"use client"

import { Check } from "lucide-react"
import posthog from "posthog-js"

import { MODULE_CATEGORY, MODULE_FACULTY, TRUN_DAY_MAP } from "@/lib/constants"
import { parseFilterList } from "@/lib/filter-modules"
import { TIME_OPTIONS } from "@/lib/generation-config"
import { cn } from "@/lib/utils"
import { usePathname } from "@/hooks/use-pathname"
import { pushSearchParams, useSearchParams } from "@/hooks/use-search-params"

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

export interface Option {
  value: string
  label: string
}

export const LEVEL_OPTIONS: Option[] = ["1", "2", "3", "4", "5", "6", "7"].map(
  (l) => ({ value: l, label: `${l}000 level` })
)

export const TYPE_OPTIONS: Option[] = Object.entries(MODULE_CATEGORY)
  .filter(([k]) => k !== "USP")
  .map(([value, label]) => ({ value, label }))

export const FACULTY_OPTIONS: Option[] = Object.entries(MODULE_FACULTY).map(
  ([value, name]) => ({ value, label: `${value} · ${name}` })
)

export const DAYS = [1, 2, 3, 4, 5, 6, 7] as const

export const FACETS: { key: FacetKey; label: string; options: Option[] }[] = [
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

export const ACTIVE =
  "bg-foreground text-background hover:bg-foreground/90 hover:text-background dark:bg-foreground dark:hover:bg-foreground/90 border-transparent dark:border-transparent"

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
  /** Shown on the mobile drawer's close button. */
  resultCount: number
  onClearAll?: () => void
}

/** Reads the filter values and writes changes to the URL. */
export function useFilters(props: ModsFilterProps) {
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

  const deleteParams = (keys: string[], analyticsType: string) => {
    const params = new URLSearchParams(searchParams.toString())
    keys.forEach((k) => params.delete(k))
    pushSearchParams(pathname, params.toString())
    posthog.capture("mods_filter_cleared", { filter_type: analyticsType })
  }

  const clearTime = () =>
    deleteParams(["moduleTimeStart", "moduleTimeEnd"], "module_time")

  /** Clears every filter but leaves the search box alone. */
  const resetFilters = () =>
    deleteParams(
      FILTER_KEYS.filter((k) => k !== "searchTerm"),
      "all"
    )

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
  const semesterOnly = props.currentOnly === "true"

  const activeCount = [
    ...FACETS.map(({ key }) => parseFilterList(values[key]).length > 0),
    days.length > 0,
    Boolean(timeSummary),
    !semesterOnly
  ].filter(Boolean).length

  return {
    setParam,
    clearTime,
    resetFilters,
    values,
    days,
    timeFrom,
    timeTo,
    timeSummary,
    daySummary,
    semesterOnly,
    activeCount
  }
}

export function summarise(
  key: FacetKey,
  selected: string[],
  options: Option[]
) {
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

export function ClearLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="text-muted-foreground hover:text-foreground mt-2 cursor-pointer px-1 text-xs transition-colors"
      onClick={onClick}>
      Clear
    </button>
  )
}

export function FacetOptions({
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

export function DaysPicker({
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

export function TimeSelect({
  label,
  value,
  onChange,
  className
}: {
  label: string
  value: string
  onChange: (v: string) => void
  className?: string
}) {
  return (
    <label
      className={cn(
        "text-muted-foreground flex items-center gap-2",
        className
      )}>
      {label}
      <select
        className="border-input bg-background text-foreground h-8 min-w-0 flex-1 rounded-md border px-2 text-sm"
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

export function TimePicker({
  from,
  to,
  onChange,
  onClear
}: {
  from: string
  to: string
  onChange: (key: string, value: string) => void
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
