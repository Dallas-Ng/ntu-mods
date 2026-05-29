"use client"

import posthog from "posthog-js"

import type { SearchModuleLevel } from "@/types/mods"
import { cn } from "@/lib/utils"
import { useModsSearchParams } from "@/hooks/use-mods-search-params"
import CustomSelect from "@/components/select"

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
            <span className="text-muted-foreground text-xs">
              {searchTerm.toUpperCase()}
            </span>
          )}
          {val}
          <span className="text-muted-foreground text-xs">XXX</span>
        </div>
      )
    }))
  ]

  return (
    <CustomSelect
      closeOnSelect
      value={value}
      selectItems={selectItems}
      onChange={(value) => {
        setValue(value as SearchModuleLevel)
        posthog.capture("mods_filter_applied", {
          filter_type: "module_level",
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
