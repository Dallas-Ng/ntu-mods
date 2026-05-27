"use client"

import { useEffect } from "react"
import posthog from "posthog-js"

interface Props {
  moduleCode: string
  isCurrentOffering: boolean
}

const ModsViewTracker = ({ moduleCode, isCurrentOffering }: Props) => {
  useEffect(() => {
    posthog.capture("module_viewed", { module_code: moduleCode, is_current_offering: isCurrentOffering })
  }, [moduleCode, isCurrentOffering])

  return null
}

export default ModsViewTracker
