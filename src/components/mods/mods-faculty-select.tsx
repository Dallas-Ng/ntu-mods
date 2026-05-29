"use client"

import posthog from "posthog-js"

import { MODULE_FACULTY } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { useModsSearchParams } from "@/hooks/use-mods-search-params"
import type { SearchModuleFaculty } from "@/types/mods"
import CustomSelect from "@/components/select"

export const ModsFacultySelect = ({ paramsValue }: { paramsValue: string }) => {
  const { value, setValue } = useModsSearchParams(paramsValue, "moduleFaculty")

  const selectItems = [
    { value: "all", label: "All Faculty" },
    ...Object.entries(MODULE_FACULTY).map(([categoryKey, categoryName]) => ({
      value: categoryKey,
      label: categoryKey
      // (
      //   <span className="text-muted-foreground">({categoryKey})</span>
      //   // <div className="min-w-0 items-baseline gap-1 text-wrap">
      //   // {/* <span>{categoryName}</span> */}
      //   // <br />
      //   // </div>
      // )
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
