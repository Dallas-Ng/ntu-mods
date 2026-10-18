"use client"

import { useEffect } from "react"

import { track } from "@/lib/analytics"

interface Props {
  moduleCode: string
  isCurrentOffering: boolean
}

const ModsViewTracker = ({ moduleCode, isCurrentOffering }: Props) => {
  useEffect(() => {
    track("module_viewed", {
      module_code: moduleCode,
      is_current_offering: isCurrentOffering
    })
  }, [moduleCode, isCurrentOffering])

  return null
}

export default ModsViewTracker
