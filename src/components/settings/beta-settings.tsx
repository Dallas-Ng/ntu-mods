"use client"

import { useSettings } from "@/hooks/use-settings"

import { BetaList } from "../beta"
import { Switch } from "../ui/switch"

const BetaSettings = () => {
  const { isBeta, updateSettings } = useSettings()

  const handleCheckChange = (checked: boolean) => {
    updateSettings({ isBeta: checked })
  }

  return (
    <>
      <div className="my-3 flex items-center gap-2">
        <Switch onCheckedChange={handleCheckChange} checked={isBeta} />{" "}
        <span className="text-sm text-foreground">
          {isBeta ? "On Beta" : "Not on Beta"}
        </span>
      </div>

      <div>
        <p className="text-sm">Current Beta Features</p>
        <BetaList />
      </div>
    </>
  )
}

export const BetaSettingsLoading = () => (
  <>
    <div className="my-3 flex items-center gap-2">
      <Switch disabled />{" "}
      <span className="text-sm text-foreground">Not on Beta</span>
    </div>

    <div>
      <p className="text-sm">Current Beta Features</p>
      <BetaList />
    </div>
  </>
)

export default BetaSettings
