"use client"

import posthog from "posthog-js"

import { TIME_OPTIONS } from "@/lib/generation-config"
import { cn } from "@/lib/utils"
import { useModsSearchParams } from "@/hooks/use-mods-search-params"
import CustomSelect from "@/components/select"

const START_ITEMS = [
  { value: "all", label: "From any time" },
  ...TIME_OPTIONS.map((t) => ({ value: String(t.value), label: `From ${t.label}` }))
]

const END_ITEMS = [
  { value: "all", label: "Until any time" },
  ...TIME_OPTIONS.map((t) => ({ value: String(t.value), label: `Until ${t.label}` }))
]

interface Props {
  startParamsValue: string
  endParamsValue: string
  disabled?: boolean
}

export const ModsTimeRangeSelect = ({
  startParamsValue,
  endParamsValue,
  disabled
}: Props) => {
  const { value: startValue, setValue: setStartValue } = useModsSearchParams(
    startParamsValue,
    "moduleTimeStart"
  )
  const { value: endValue, setValue: setEndValue } = useModsSearchParams(
    endParamsValue,
    "moduleTimeEnd"
  )

  const handleStartChange = (v: string | null) => {
    if (v !== null) {
      setStartValue(v)
      posthog.capture("mods_filter_applied", {
        filter_type: "module_time_start",
        value: v
      })
    }
  }

  const handleEndChange = (v: string | null) => {
    if (v !== null) {
      setEndValue(v)
      posthog.capture("mods_filter_applied", {
        filter_type: "module_time_end",
        value: v
      })
    }
  }

  const startActive = startValue !== "all"
  const endActive = endValue !== "all"

  return (
    <div className="flex gap-2">
      <CustomSelect
        closeOnSelect
        value={startValue}
        selectItems={START_ITEMS}
        onChange={handleStartChange}
        disabled={disabled}
        divClassName={cn("w-full", startActive && "ring-ring rounded-md ring-1")}
      />
      <CustomSelect
        closeOnSelect
        value={endValue}
        selectItems={END_ITEMS}
        onChange={handleEndChange}
        disabled={disabled}
        divClassName={cn("w-full", endActive && "ring-ring rounded-md ring-1")}
      />
    </div>
  )
}
