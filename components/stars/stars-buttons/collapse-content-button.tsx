"use client"

import { useBoundState } from "@/state/bound-state"
import { FoldHorizontal, UnfoldHorizontal } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function CollapseContentButton() {
  const { updateSettings, settings } = useBoundState()
  const { collapsedView } = settings

  const handleClick = () => updateSettings({ collapsedView: !collapsedView })

  return (
    <Button variant="outline" onClick={handleClick} size="icon">
      {collapsedView ? (
        <UnfoldHorizontal className="h-5 w-5 rotate-90" />
      ) : (
        <FoldHorizontal className="h-5 w-5 rotate-90" />
      )}
    </Button>
  )
}
