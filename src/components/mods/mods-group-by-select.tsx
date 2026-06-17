"use client"

import posthog from "posthog-js"

import type { ModsGroupBy } from "@/types/mods"
import { useSettings } from "@/hooks/use-settings"
import CustomSelect from "@/components/select"

const GROUP_BY_OPTIONS: { value: ModsGroupBy; label: string }[] = [
  { value: "none", label: "No Grouping" },
  { value: "level", label: "By Level" },
  { value: "au", label: "By AU" },
  { value: "faculty", label: "By Faculty" },
  { value: "type", label: "By Type" }
]

export const ModsGroupBySelect = () => {
  const { modsGroupBy, updateSettings } = useSettings()

  return (
    <CustomSelect
      closeOnSelect
      value={modsGroupBy}
      selectItems={GROUP_BY_OPTIONS}
      onChange={(value) => {
        const groupBy = (value ?? "none") as ModsGroupBy
        updateSettings({ modsGroupBy: groupBy })
        posthog.capture("mods_grouped", { group_by: groupBy })
      }}
      divClassName="w-full lg:w-[170px]"
    />
  )
}
