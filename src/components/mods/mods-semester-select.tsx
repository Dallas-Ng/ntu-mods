"use client"

import { cn } from "@/lib/utils"
import { useModsSearchParams } from "@/hooks/use-mods-search-params"
import CustomSelect from "@/components/select"

export type Semester = "s1" | "s2" | "all"

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
        { value: "all", label: "All Sems" },
        { value: "s1", label: "Sem 1" },
        { value: "s2", label: "Sem 2" }
      ]}
      onChange={(value) => setValue(value as Semester)}
      divClassName={cn(
        "basis-1/2 lg:w-[200px]",
        value !== "all" && "ring-1 ring-ring rounded-md"
      )}
    />
  )
}
