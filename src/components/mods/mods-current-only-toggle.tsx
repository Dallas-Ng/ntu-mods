"use client"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useModsSearchParams } from "@/hooks/use-mods-search-params"

export const ModsCurrentOnlyToggle = ({
  paramsValue
}: {
  paramsValue: string
}) => {
  const { value, setValue } = useModsSearchParams(paramsValue, "currentOnly")

  return (
    <div className="flex items-center gap-2">
      <Switch
        id="current-only"
        checked={value === "true"}
        onCheckedChange={(checked) => setValue(checked ? "true" : "false")}
      />
      <Label
        htmlFor="current-only"
        className="cursor-pointer whitespace-nowrap text-sm">
        Current sem only
      </Label>
    </div>
  )
}
