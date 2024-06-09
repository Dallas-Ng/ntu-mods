"use client"

import { useSettings } from "@/hooks/use-settings"

/**
 * !!!Important, this will make any component inside a client component
 *
 * This is not a real problem as for a user to be in "beta" mode, it requires them to go to settings already.
 */
export const BetaWrapper = ({ children }: { children?: React.ReactNode }) => {
  const { isBeta } = useSettings()

  const isOnBetaDomain = window.location.host === "beta.ntumods.com"

  return isOnBetaDomain || isBeta ? <>{children}</> : <></>
}

type BetaKeys = {
  title: string | React.ReactNode
  desc: string | React.ReactNode
}

const BETA_KEYS: BetaKeys[] = [
  // {
  //   title: "Faculty Pages",
  //   desc: "View mods by faculty"
  // }
]

export const BetaList = () =>
  BETA_KEYS.map((item, idx) => (
    <div key={idx} className="ml-3">
      <ol className="list-inside list-decimal text-sm">
        <li>
          <span>{item.title}</span>
          <span className="ml-1 text-sm text-muted-foreground">
            {item.desc}
          </span>
        </li>
      </ol>
    </div>
  ))

export default BetaWrapper
