"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import CustomSelect from "@/components/select"

const getModuleLevels = (moduleKeys: [string, Module][]) => {
  return moduleKeys.reduce((levels, [key]) => {
    levels.add(key.slice(2, 3))
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
    const params = new URLSearchParams(searchParams)
    params.set("moduleLevel", moduleLevel)
    replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [moduleLevel])

  useEffect(() => {
    // If there are no mods showing, clear the filter
    if (filterModsLength === 0) setModuleLevel("all")
  }, [filterModsLength])

  const moduleSelectItems = Array.from(getModuleLevels(Object.values(modules)))
    .map((val) => ({
      value: val,
      label: (
        <span>
          {searchTerm.length == 2 && (
            <span className="text-xs text-muted-foreground">
              {searchTerm.toUpperCase()}
            </span>
          )}
          {val}
          <span className="text-xs text-muted-foreground">XXX</span>
        </span>
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
      closeOnSelect
      defaultValue={defaultValue}
      selectItems={selectItems.filter((item) => item.value !== "0")}
      onChange={(value) => setModuleLevel(value as SearchModuleLevel)}
      divClassName="w-full lg:max-w-[130px]"
    />
  )
}
