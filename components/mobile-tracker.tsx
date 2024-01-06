"use client"

import React, { Fragment, useEffect } from "react"
import { useBoundState } from "@/state/bound-state"

import { useMediaQuery } from "@/hooks/use-media-query"

const MOBILE_QUERY = "(max-width: 768px)"

/**
 * A memoized component that tracks the mobile state and updates the information using the `updateInfo` function from `useBoundState`.
 * @returns Fragment
 */
const MobileTracker = React.memo(() => {
  const { updateInfo } = useBoundState()
  const mobile = useMediaQuery(MOBILE_QUERY)

  useEffect(() => {
    updateInfo({ mobile })
  }, [mobile, updateInfo])

  return <Fragment />
})

MobileTracker.displayName = "MobileTracker"

export default MobileTracker
