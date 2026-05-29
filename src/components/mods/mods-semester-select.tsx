"use client"

import posthog from "posthog-js"

import { cn } from "@/lib/utils"
import { useModsSearchParams } from "@/hooks/use-mods-search-params"
import type { Semester } from "@/types/mods"
import CustomSelect from "@/components/select"

export const ModsSemesterSelect = ({
  paramsValue
}: {
  paramsValue: string
}) => {
  const { value, setValue } = useModsSearchParams(paramsValue, "semester")

  return (
    <CustomSelect
      closeOnSelect
      value={value}
      selectItems={[
        // { value: "all", label: "All Sems" },
        { value: "s1", label: "Sem 1" }
        // { value: "s2", label: "Sem 2" }
      ]}
      onChange={(value) => {
        setValue(value as Semester)
        posthog.capture("mods_filter_applied", {
          filter_type: "semester",
          value
        })
      }}
      divClassName={cn(
        "basis-1/2 lg:w-[200px]",
        value !== "all" && "ring-ring rounded-md ring-1"
      )}
    />
  )
}
