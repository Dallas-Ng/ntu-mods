"use client"

import { useModsSearchParams } from "@/hooks/use-mods-search-params"
import CustomSelect from "@/components/select"

export const ModsCurrentOnlyToggle = ({
  paramsValue
}: {
  paramsValue: string
}) => {
  const { value, setValue } = useModsSearchParams(paramsValue, "currentOnly")

  const selectItems = [
    { value: "true", label: "Current Semester" },
    { value: "false", label: "All Semesters" }
  ]

  return (
    <CustomSelect
      closeOnSelect
      value={value}
      selectItems={selectItems}
      onChange={(v) => { if (v !== null) setValue(v) }}
      divClassName="w-full ring-ring rounded-md ring-1"
    />
  )
}
