"use client"

import posthog from "posthog-js"

import { MODULE_CATEGORY } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { useModsSearchParams } from "@/hooks/use-mods-search-params"
import CustomSelect from "@/components/select"

export type SearchModuleType = ModuleType | "all"

const SELECT_ITEMS = [
  { value: "all", label: "All Module Types" },
  ...Object.entries(MODULE_CATEGORY)
    .filter(([k]) => k !== "USP")
    .map(([categoryKey, categoryName]) => ({
      value: categoryKey,
      label: categoryName
    }))
]

export const ModsModuleTypeSelect = ({
  paramsValue
}: {
  paramsValue: string
}) => {
  const { value, setValue } = useModsSearchParams(paramsValue, "moduleType")

  const handleChange = (nextValue: string | null) => {
    if (nextValue !== null) {
      setValue(nextValue)
      posthog.capture("mods_filter_applied", { filter_type: "module_type", value: nextValue })
    }
  }

  return (
    <CustomSelect
      closeOnSelect
      value={value}
      selectItems={SELECT_ITEMS}
      onChange={handleChange}
      divClassName={cn(
        "w-full",
        value !== "all" && "ring-ring rounded-md ring-1"
      )}
    />
  )
}
