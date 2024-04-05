"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import CustomSelect from "@/components/select"

const getModuleLevels = (moduleKeys: [string, Module][]) => {
  return moduleKeys.reduce((levels, [key]) => {
    const int = parseInt(key.slice(2, 3))

    // Only set keys which are numbers
    // Mods like `ADP26N` "P" character keys is hidden from user
    // Mods like CC00002, 0 key is hidden from user
    if (!isNaN(int) && int > 0) {
      levels.add(int.toString())
    }

    return levels
  }, new Set<string>())
}

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
  defaultValue?: SearchModuleLevel
  modules: [string, Module][]
  filterModsLength: number
  searchTerm: string
}

export const ModsLevelSelect = ({
  defaultValue = "all",
  modules = [],
  filterModsLength = 0,
  searchTerm
}: Props) => {
  const [moduleLevel, setModuleLevel] =
    useState<SearchModuleLevel>(defaultValue)
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()

  useEffect(() => {
    setModuleLevel(defaultValue)
  }, [defaultValue])

  useEffect(() => {
    if (defaultValue === moduleLevel) return

    const params = new URLSearchParams(searchParams)
    params.set("moduleLevel", moduleLevel)
    replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [moduleLevel])

  useEffect(() => {
    // If there are no mods showing, clear the filter
    if (modules.length === 0 && filterModsLength === 0) setModuleLevel("all")
  }, [modules, filterModsLength])

  const moduleSelectItems = Array.from(getModuleLevels(Object.values(modules)))
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
      disabled={modules.length === 0 && filterModsLength === 0}
      closeOnSelect
      defaultValue={moduleLevel}
      selectItems={selectItems}
      onChange={(value) => setModuleLevel(value as SearchModuleLevel)}
      divClassName="basis-1/2 lg:w-[150px]"
    />
  )
}
