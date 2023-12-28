"use client"

import { useBoundState } from "@/state/bound-state"

import { Button } from "@/components/ui/button"

export default function CollapseContentButton() {
  const { updateSettings, settings } = useBoundState()
  const { collapsedView } = settings

  const handleClick = () => updateSettings({ collapsedView: !collapsedView })

  return (
    <Button variant="outline" onClick={handleClick}>
      {collapsedView ? "Show All Details" : "Condense View"}
    </Button>
  )
}
