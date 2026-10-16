"use client"

import posthog from "posthog-js"

import { useModsSearchParams } from "@/hooks/use-mods-search-params"
import { ModsChip } from "@/components/mods/mods-filter-field"

const OPTIONS = [
  { value: "true", label: "This semester" },
  { value: "false", label: "All past semesters too" }
]

export const ModsCurrentOnlyToggle = ({
  paramsValue
}: {
  paramsValue: string
}) => {
  const { value, setValue } = useModsSearchParams(paramsValue, "currentOnly")

  return (
    <div className="flex flex-wrap gap-1.5">
      {OPTIONS.map((o) => (
        <ModsChip
          key={o.value}
          active={value === o.value}
          onClick={() => {
            setValue(o.value)
            posthog.capture("mods_filter_applied", {
              filter_type: "current_only",
              value: o.value
            })
          }}>
          {o.label}
        </ModsChip>
      ))}
    </div>
  )
}
