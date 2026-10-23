"use client"

import type { ModsGroupBy } from "@/types/mods"
import { track } from "@/lib/analytics"
import { useSettings } from "@/hooks/use-settings"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"

const GROUP_BY_OPTIONS: { value: ModsGroupBy; label: string }[] = [
  { value: "none", label: "None" },
  { value: "level", label: "Level" },
  { value: "au", label: "AUs" },
  { value: "faculty", label: "School" },
  { value: "type", label: "Type" }
]

export const ModsGroupBySelect = () => {
  const { modsGroupBy, updateSettings } = useSettings()

  return (
    <Select
      value={modsGroupBy}
      onValueChange={(value) => {
        updateSettings({ modsGroupBy: value as ModsGroupBy })
        track("mods_grouped", { group_by: value })
      }}>
      <SelectTrigger className="w-full sm:w-[130px]" aria-label="Group by">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {GROUP_BY_OPTIONS.map(({ value, label }) => (
          <SelectItem key={value} value={value}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
