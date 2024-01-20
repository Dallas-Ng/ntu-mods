"use client"

import { Fragment, memo, useEffect } from "react"
import { useBoundState } from "@/state/bound.state"

import { useMediaQuery } from "@/hooks/use-media-query"

const MOBILE_QUERY = "(max-width: 768px)"

/**
 * A memoized component that tracks the mobile state and updates the information using the `updateInfo` function from `useBoundState`.
 * @returns Fragment
 */
const MobileTracker = memo(() => {
  const { updateSettings } = useBoundState()
  const isMobile = useMediaQuery(MOBILE_QUERY)

  useEffect(() => {
    updateSettings({ isMobile })
  }, [isMobile, updateSettings])

  return <Fragment />
})

MobileTracker.displayName = "MobileTracker"

export default MobileTracker
