"use client"

import { MODULE_CATEGORY } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { useModsSearchParams } from "@/hooks/use-mods-search-params"
import CustomSelect from "@/components/select"

export type SearchModuleType = ModuleType | "all"

export const ModsModuleTypeSelect = ({
  paramsValue
}: {
  paramsValue: string
}) => {
  const { value, setValue } = useModsSearchParams(paramsValue, "moduleType")

  const selectItems = [
    { value: "all", label: "All Module Types" },
    ...Object.entries(MODULE_CATEGORY)
      .filter(([k]) => k !== "USP")
      .map(([categoryKey, categoryName]) => ({
        value: categoryKey,
        label: categoryName
      }))
  ]

  return (
    <CustomSelect
      closeOnSelect
      value={value}
      selectItems={selectItems}
      onChange={(value) => setValue(value as SearchModuleType)}
      divClassName={cn(
        "w-full lg:w-[200px]",
        value !== "all" && "ring-ring rounded-md ring-1"
      )}
    />
  )
}
