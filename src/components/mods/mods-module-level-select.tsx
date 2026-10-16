"use client"

import posthog from "posthog-js"

import type { SearchModuleLevel } from "@/types/mods"
import { useModsSearchParams } from "@/hooks/use-mods-search-params"
import { ModsChip } from "@/components/mods/mods-filter-field"

const LEVELS = ["1", "2", "3", "4", "5", "6", "7"]

interface Props {
  paramValue: string
}

export const ModsLevelSelect = ({ paramValue }: Props) => {
  const { value, setValue } = useModsSearchParams(paramValue, "moduleLevel")

  const choose = (next: string) => {
    setValue(next as SearchModuleLevel)
    posthog.capture("mods_filter_applied", {
      filter_type: "module_level",
      value: next
    })
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      <ModsChip active={value === "all"} onClick={() => choose("all")}>
        Any
      </ModsChip>
      {LEVELS.map((l) => (
        <ModsChip key={l} active={value === l} onClick={() => choose(l)}>
          {l}000
        </ModsChip>
      ))}
    </div>
  )
}
