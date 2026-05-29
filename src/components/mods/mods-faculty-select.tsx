"use client"

import posthog from "posthog-js"

import type { SearchModuleFaculty } from "@/types/mods"
import { MODULE_FACULTY } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { useModsSearchParams } from "@/hooks/use-mods-search-params"
import CustomSelect from "@/components/select"

export const ModsFacultySelect = ({ paramsValue }: { paramsValue: string }) => {
  const { value, setValue } = useModsSearchParams(paramsValue, "moduleFaculty")

  const selectItems = [
    { value: "all", label: "All Faculty" },
    ...Object.entries(MODULE_FACULTY).map(([categoryKey]) => ({
      value: categoryKey,
      label: categoryKey
    }))
  ]

  return (
    <CustomSelect
      closeOnSelect
      value={value}
      selectItems={selectItems}
      onChange={(value) => {
        setValue(value as SearchModuleFaculty)
        posthog.capture("mods_filter_applied", {
          filter_type: "faculty",
          value
        })
      }}
      divClassName={cn(
        "w-full",
        value !== "all" && "ring-ring rounded-md ring-1"
      )}
    />
  )
}
