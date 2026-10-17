"use client"

import { Check, ChevronDown } from "lucide-react"
import posthog from "posthog-js"

import { MODULE_CATEGORY, MODULE_FACULTY, TRUN_DAY_MAP } from "@/lib/constants"
import { parseFilterList } from "@/lib/filter-modules"
import { TIME_OPTIONS } from "@/lib/generation-config"
import { cn } from "@/lib/utils"
import { usePathname } from "@/hooks/use-pathname"
import { pushSearchParams, useSearchParams } from "@/hooks/use-search-params"
import { Button } from "@/components/ui/button"
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

const FACET_LABEL: Record<FacetKey, string> = {
  moduleLevel: "Level",
  moduleType: "Type",
  moduleFaculty: "School"
}

const FACET_ANALYTICS: Record<string, string> = {
  moduleLevel: "module_level",
  moduleType: "module_type",
  moduleFaculty: "faculty",
  moduleDay: "module_day",
  moduleTimeStart: "module_time_start",
  moduleTimeEnd: "module_time_end",
  currentOnly: "current_only"
}

interface Props {
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

export const ModsFilterChips = ({
  moduleType,
  moduleFaculty,
  moduleLevel,
  moduleDay,
  moduleTimeStart,
  moduleTimeEnd,
  currentOnly,
  countOption,
  onClearAll
}: Props) => {
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

  const facets: {
    key: FacetKey
    value: string
    options: Option[]
  }[] = [
    { key: "moduleLevel", value: moduleLevel, options: LEVEL_OPTIONS },
    { key: "moduleType", value: moduleType, options: TYPE_OPTIONS },
    { key: "moduleFaculty", value: moduleFaculty, options: FACULTY_OPTIONS }
  ]

  const days = parseFilterList(moduleDay).map(Number)
  const timeFrom = moduleTimeStart !== "all" ? moduleTimeStart : ""
  const timeTo = moduleTimeEnd !== "all" ? moduleTimeEnd : ""
  const timeLabel = (v: string) =>
    TIME_OPTIONS.find((t) => String(t.value) === v)?.label ?? v

  return (
    <div className="flex flex-wrap gap-2">
      {facets.map(({ key, value, options }) => {
        const selected = parseFilterList(value)
        const summary = summarise(key, selected, options)
        return (
          <FilterChip
            key={key}
            label={
              summary ? `${FACET_LABEL[key]}: ${summary}` : FACET_LABEL[key]
            }
            active={selected.length > 0}>
            <div className="max-h-72 overflow-y-auto">
              {options.map((o) => {
                const on = selected.includes(o.value)
                const n = countOption(key, o.value)
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    className="hover:bg-accent flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors"
                    onClick={() =>
                      setParam(
                        key,
                        (on
                          ? selected.filter((v) => v !== o.value)
                          : [...selected, o.value]
                        ).join(",")
                      )
                    }>
                    <span
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
            </div>
            {selected.length > 0 && (
              <ClearLink onClick={() => setParam(key, "all")} />
            )}
          </FilterChip>
        )
      })}

      <FilterChip
        label={
          days.length > 0
            ? `Days: ${days
                .map((d) => TRUN_DAY_MAP[d as keyof typeof TRUN_DAY_MAP])
                .join(", ")}`
            : "Days"
        }
        active={days.length > 0}>
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
                  setParam(
                    "moduleDay",
                    (on
                      ? days.filter((x) => x !== d)
                      : [...days, d].sort()
                    ).join(",")
                  )
                }>
                {TRUN_DAY_MAP[d as keyof typeof TRUN_DAY_MAP]}
              </button>
            )
          })}
        </div>
        {days.length > 0 && (
          <ClearLink onClick={() => setParam("moduleDay", "all")} />
        )}
      </FilterChip>

      <FilterChip
        label={
          timeFrom && timeTo
            ? `Time: ${timeLabel(timeFrom)}–${timeLabel(timeTo)}`
            : timeFrom
              ? `Time: after ${timeLabel(timeFrom)}`
              : timeTo
                ? `Time: before ${timeLabel(timeTo)}`
                : "Time"
        }
        active={Boolean(timeFrom || timeTo)}>
        <p className="text-muted-foreground px-1 pb-2 text-xs">
          Only show modules whose classes all fit inside this window.
        </p>
        <div className="flex items-center gap-2 px-1 text-sm">
          <TimeSelect
            label="From"
            value={moduleTimeStart}
            onChange={(v) => setParam("moduleTimeStart", v)}
          />
          <TimeSelect
            label="to"
            value={moduleTimeEnd}
            onChange={(v) => setParam("moduleTimeEnd", v)}
          />
        </div>
        {(timeFrom || timeTo) && (
          <ClearLink
            onClick={() => {
              const params = new URLSearchParams(searchParams.toString())
              params.delete("moduleTimeStart")
              params.delete("moduleTimeEnd")
              pushSearchParams(pathname, params.toString())
              posthog.capture("mods_filter_cleared", {
                filter_type: "module_time"
              })
            }}
          />
        )}
      </FilterChip>

      <Button
        variant="outline"
        size="sm"
        aria-pressed={currentOnly === "true"}
        className={cn(
          "h-8 shrink-0 rounded-full px-3",
          currentOnly === "true" &&
            "bg-foreground text-background hover:bg-foreground/90 hover:text-background dark:bg-foreground dark:hover:bg-foreground/90 border-transparent dark:border-transparent"
        )}
        onClick={() =>
          setParam(
            "currentOnly",
            currentOnly === "true" ? "false" : "true",
            "true"
          )
        }>
        This semester only
      </Button>

      {onClearAll && (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground h-8 rounded-full px-3"
          onClick={onClearAll}>
          Clear all
        </Button>
      )}
    </div>
  )
}

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
            active &&
              "bg-foreground text-background hover:bg-foreground/90 hover:text-background dark:bg-foreground dark:hover:bg-foreground/90 border-transparent dark:border-transparent"
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
