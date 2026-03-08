"use client"

import { cn } from "@/lib/utils"
import { useModsSearchParams } from "@/hooks/use-mods-search-params"
import CustomSelect from "@/components/select"

export type SearchModuleLevel =
  | "1"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "all"

const LEVELS = ["1", "2", "3", "4", "5", "6", "7"]

interface Props {
  paramValue: string
  searchTerm: string
}

export const ModsLevelSelect = ({ paramValue, searchTerm }: Props) => {
  const { value, setValue } = useModsSearchParams(paramValue, "moduleLevel")

  const selectItems = [
    { value: "all", label: "All Levels" },
    ...LEVELS.map((val) => ({
      value: val,
      label: (
        <div>
          {searchTerm.length === 2 && (
            <span className="text-xs text-muted-foreground">
              {searchTerm.toUpperCase()}
            </span>
          )}
          {val}
          <span className="text-xs text-muted-foreground">XXX</span>
        </div>
      )
    }))
  ]

  return (
    <CustomSelect
      closeOnSelect
      value={value}
      selectItems={selectItems}
      onChange={(value) => setValue(value as SearchModuleLevel)}
      divClassName={cn(
        "w-full lg:w-[150px]",
        value !== "all" && "ring-1 ring-ring rounded-md"
      )}
    />
  )
}
