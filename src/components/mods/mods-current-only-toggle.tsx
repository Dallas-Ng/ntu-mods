"use client"

import posthog from "posthog-js"

import { useModsSearchParams } from "@/hooks/use-mods-search-params"
import CustomSelect from "@/components/select"

const SELECT_ITEMS = [
  { value: "true", label: "Current Semester" },
  { value: "false", label: "All Semesters" }
]

export const ModsCurrentOnlyToggle = ({
  paramsValue
}: {
  paramsValue: string
}) => {
  const { value, setValue } = useModsSearchParams(paramsValue, "currentOnly")

  const handleChange = (nextValue: string | null) => {
    if (nextValue !== null) {
      setValue(nextValue)
      posthog.capture("mods_filter_applied", { filter_type: "current_only", value: nextValue })
    }
  }

  return (
    <CustomSelect
      closeOnSelect
      value={value}
      selectItems={SELECT_ITEMS}
      onChange={handleChange}
      divClassName="w-full ring-ring rounded-md ring-1"
    />
  )
}
