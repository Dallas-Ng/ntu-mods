"use client"

import { useSettings } from "@/hooks/use-settings"
import CustomSelect from "@/components/select"

export type ModsGroupBy = "none" | "level" | "au" | "faculty" | "type"

const GROUP_BY_OPTIONS: { value: ModsGroupBy; label: string }[] = [
  { value: "none", label: "No grouping" },
  { value: "level", label: "Group by level" },
  { value: "au", label: "Group by AU" },
  { value: "faculty", label: "Group by faculty" },
  { value: "type", label: "Group by type" }
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
