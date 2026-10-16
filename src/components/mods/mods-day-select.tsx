"use client"

import posthog from "posthog-js"

import { TRUN_DAY_MAP } from "@/lib/constants"
import { useModsSearchParams } from "@/hooks/use-mods-search-params"
import { ModsChip } from "@/components/mods/mods-filter-field"

const ALL_DAYS = [1, 2, 3, 4, 5, 6, 7] as const

function parseDays(value: string): number[] {
  if (value === "all") return []
  return value
    .split(",")
    .map(Number)
    .filter((d) => d >= 1 && d <= 7)
}

interface Props {
  paramsValue: string
}

// Nothing selected means "any day". Selecting days keeps only modules with an
// index whose classes all fall on those days.
export const ModsDaySelect = ({ paramsValue }: Props) => {
  const { value, setValue } = useModsSearchParams(paramsValue, "moduleDay")
  const selected = parseDays(value)

  const toggleDay = (day: number) => {
    const next = selected.includes(day)
      ? selected.filter((d) => d !== day)
      : [...selected, day].sort((a, b) => a - b)
    const encoded = next.length === 0 ? "all" : next.join(",")
    setValue(encoded)
    posthog.capture("mods_filter_applied", {
      filter_type: "module_day",
      value: encoded
    })
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {ALL_DAYS.map((day) => (
        <ModsChip
          key={day}
          active={selected.includes(day)}
          onClick={() => toggleDay(day)}>
          {TRUN_DAY_MAP[day as keyof typeof TRUN_DAY_MAP]}
        </ModsChip>
      ))}
    </div>
  )
}
