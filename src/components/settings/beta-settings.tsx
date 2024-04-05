"use client"

import Link from "next/link"

import { useSettings } from "@/hooks/use-settings"

import { BetaList } from "../beta"
import { Switch } from "../ui/switch"

const BetaSettings = () => {
  const { isBeta, updateSettings } = useSettings()

  const isOnBetaDomain = window.location.host === "beta.ntumods.com"

  const currentlyBeta = isOnBetaDomain || isBeta

  const handleCheckChange = (checked: boolean) => {
    updateSettings({ isBeta: checked })
  }

  return (
    <>
      {isOnBetaDomain && (
        <p className="text-center text-sm">
          You cannot opt of beta as you are on <strong>beta.ntumods.com</strong>
          .
          <br />
          <Link
            href="https://ntumods.com"
            className="text-blue-500 transition-colors hover:text-blue-600">
            Click here to go to the main website
          </Link>
        </p>
      )}

      <div className="my-3 flex items-center gap-2">
        <Switch
          onCheckedChange={handleCheckChange}
          checked={currentlyBeta}
          disabled={isOnBetaDomain}
        />{" "}
        <span className="text-sm text-foreground">
          {currentlyBeta ? "On Beta" : "Not on Beta"}
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
