"use client"

import { useEffect } from "react"

import { getModuleLevels } from "@/lib/get-module-levels"
import { cn } from "@/lib/utils"
import { useModsSearchParams } from "@/hooks/use-mods-search-params"
import CustomSelect from "@/components/select"

export type SearchModuleLevel =
  | "0000" // technically this exist, but we hide it from the user
  | "1000"
  | "2000"
  | "3000"
  | "4000"
  | "5000"
  | "6000"
  | "7000"
  // We do not support "{char}000" because I feel it adds no benefit (?)
  | "all"

interface Props {
  moduleLevels: string[]
  filterModsLength: number
  paramValue: string
  searchTerm: string
}

export const ModsLevelSelect = ({
  moduleLevels = [],
  filterModsLength = 0,
  paramValue,
  searchTerm
}: Props) => {
  const { value, setValue } = useModsSearchParams(paramValue, "level")

  useEffect(() => {
    if (filterModsLength === 0 && moduleLevels.length !== 0) {
      setValue("all")
    }
  }, [filterModsLength, moduleLevels])

  const moduleSelectItems = moduleLevels
    .map((val) => ({
      value: val,
      label: (
        <div>
          {searchTerm.length == 2 && (
            <span className="text-xs text-muted-foreground">
              {searchTerm.toUpperCase()}
            </span>
          )}
          {val}
          <span className="text-xs text-muted-foreground">XXX</span>
        </div>
      )
    }))
    // Sort by alpha/numeric
    .sort((a, b) => a.value.localeCompare(b.value))

  const selectItems = [
    { value: "all", label: "All Levels" },
    ...moduleSelectItems
  ]

  return (
    <CustomSelect
      disabled={moduleLevels.length === 0 && filterModsLength === 0}
      closeOnSelect
      value={value}
      selectItems={selectItems}
      onChange={(value) => setValue(value as SearchModuleLevel)}
      divClassName={cn(
        "basis-1/2 lg:w-[150px]",
        value !== "all" && "ring-1 ring-ring rounded-md"
      )}
    />
  )
}
