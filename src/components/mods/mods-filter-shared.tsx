"use client"

import posthog from "posthog-js"

import { MODULE_CATEGORY, MODULE_FACULTY, TRUN_DAY_MAP } from "@/lib/constants"
import { parseFilterList } from "@/lib/filter-modules"
import { TIME_OPTIONS } from "@/lib/generation-config"
import { cn } from "@/lib/utils"
import { usePathname } from "@/hooks/use-pathname"
import { pushSearchParams, useSearchParams } from "@/hooks/use-search-params"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

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
          <label
            key={o.value}
            className="hover:bg-accent flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors">
            <Checkbox
              checked={on}
              onCheckedChange={() =>
                onChange(
                  on
                    ? selected.filter((v) => v !== o.value)
                    : [...selected, o.value]
                )
              }
            />
            <span className="min-w-0 flex-1 truncate">{o.label}</span>
            <span
              className={cn(
                "text-muted-foreground text-xs tabular-nums",
                n === 0 && "opacity-40"
              )}>
              {n}
            </span>
          </label>
        )
      })}
      {selected.length > 0 && <ClearLink onClick={() => onChange([])} />}
    </div>
  )
}

interface ChipOption {
  value: string
  label: React.ReactNode
  /** Dimmed when it would give no results, but still selectable. */
  faded?: boolean
}

/** Multi-select chips built on the shadcn toggle group. */
export function ChipGroup({
  value,
  onValueChange,
  options,
  layout = "wrap",
  className
}: {
  value: string[]
  onValueChange: (next: string[]) => void
  options: ChipOption[]
  /** `grid` is seven equal columns for levels and days. */
  layout?: "wrap" | "grid"
  className?: string
}) {
  return (
    <ToggleGroup
      type="multiple"
      variant="outline"
      spacing={2}
      value={value}
      onValueChange={onValueChange}
      className={cn(
        "w-full",
        layout === "grid"
          ? "grid grid-cols-7 gap-1.5"
          : "flex flex-wrap justify-start gap-2",
        className
      )}>
      {options.map((o) => (
        <ToggleGroupItem
          key={o.value}
          value={o.value}
          className={cn(
            "cursor-pointer shadow-none",
            "data-[state=on]:bg-foreground data-[state=on]:text-background data-[state=on]:hover:bg-foreground/90 data-[state=on]:hover:text-background data-[state=on]:border-transparent data-[state=on]:font-semibold",
            layout === "grid"
              ? "h-10 rounded-lg px-0"
              : "h-9 min-w-12 rounded-full px-3.5",
            o.faded && !value.includes(o.value) && "opacity-40"
          )}>
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

/** Title, one-line hint and an optional Clear link, shared by the popovers. */
function PickerHeader({
  title,
  hint,
  onClear
}: {
  title: string
  hint: string
  onClear?: () => void
}) {
  return (
    <div className="space-y-0.5">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium">{title}</span>
        {onClear && (
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground cursor-pointer text-xs transition-colors"
            onClick={onClear}>
            Clear
          </button>
        )}
      </div>
      <p className="text-muted-foreground text-xs">{hint}</p>
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
    <div className="flex flex-col gap-3 p-1">
      <PickerHeader
        title="Class days"
        hint="Only modules with classes on these days"
        onClear={days.length > 0 ? () => onChange([]) : undefined}
      />
      <ChipGroup
        layout="grid"
        value={days.map(String)}
        onValueChange={(next) => onChange(next.map(Number).sort())}
        options={DAYS.map((d) => ({
          value: String(d),
          label: TRUN_DAY_MAP[d as keyof typeof TRUN_DAY_MAP]
        }))}
        className="[&_[data-slot=toggle-group-item]]:h-9 [&_[data-slot=toggle-group-item]]:text-[13px]"
      />
    </div>
  )
}

export function TimeSelect({
  ariaLabel,
  value,
  onChange,
  className,
  triggerClassName
}: {
  ariaLabel: string
  value: string
  onChange: (v: string) => void
  className?: string
  triggerClassName?: string
}) {
  return (
    <div
      className={cn(
        "text-muted-foreground flex items-center gap-2",
        className
      )}>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger
          size="sm"
          aria-label={ariaLabel}
          className={cn("min-w-0 flex-1", triggerClassName)}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any time</SelectItem>
          {TIME_OPTIONS.map((t) => (
            <SelectItem key={t.value} value={String(t.value)}>
              {t.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function TimeField({
  label,
  ariaLabel,
  value,
  onChange
}: {
  label: string
  ariaLabel: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="text-muted-foreground text-xs">{label}</span>
      <TimeSelect
        ariaLabel={ariaLabel}
        value={value}
        onChange={onChange}
        triggerClassName="data-[size=sm]:h-9"
      />
    </div>
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
    <div className="flex flex-col gap-3 p-1">
      <PickerHeader
        title="Class times"
        hint="Only modules with classes inside this window"
        onClear={onClear}
      />
      <div className="grid grid-cols-2 gap-3">
        <TimeField
          label="From"
          ariaLabel="Earliest start time"
          value={from}
          onChange={(v) => onChange("moduleTimeStart", v)}
        />
        <TimeField
          label="To"
          ariaLabel="Latest end time"
          value={to}
          onChange={(v) => onChange("moduleTimeEnd", v)}
        />
      </div>
    </div>
  )
}
