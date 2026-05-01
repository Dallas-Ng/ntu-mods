"use client"

import { useSettings } from "@/hooks/use-settings"
import CustomSelect from "@/components/select"

export type ModsGroupBy = "none" | "level" | "au" | "faculty" | "type"

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
      onChange={(value) =>
        updateSettings({ modsGroupBy: (value ?? "none") as ModsGroupBy })
      }
      divClassName="w-full lg:w-[170px]"
    />
  )
}
