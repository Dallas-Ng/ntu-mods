"use client"

import { MODULE_FACULTY } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { useModsSearchParams } from "@/hooks/use-mods-search-params"
import CustomSelect from "@/components/select"

export type SearchModuleFaculty = ModuleFaculty | "all"

export const ModsFacultySelect = ({ paramsValue }: { paramsValue: string }) => {
  const { value, setValue } = useModsSearchParams(paramsValue, "moduleFaculty")

  const selectItems = [
    { value: "all", label: "All Faculty" },
    ...Object.entries(MODULE_FACULTY).map(([categoryKey, categoryName]) => ({
      value: categoryKey,
      label: (
        <div className="flex items-baseline gap-1">
          {categoryName}

          <span className="text-xs text-muted-foreground">({categoryKey})</span>
        </div>
      )
    }))
  ]

  return (
    <CustomSelect
      closeOnSelect
      value={value}
      selectItems={selectItems}
      onChange={(value) => setValue(value as SearchModuleFaculty)}
      divClassName={cn(
        "w-full lg:max-w-[350px]",
        value !== "all" && "ring-1 ring-ring rounded-md"
      )}
    />
  )
}
