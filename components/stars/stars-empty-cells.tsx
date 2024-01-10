"use client"

import Link from "next/link"
import { useBoundState } from "@/state/bound-state"
import { InfoIcon } from "lucide-react"

export default function StarsEmptyCells() {
  const { settings } = useBoundState()

  // Counts total number of disabled settings
  const threshold =
    Object.values(settings.starsCell).reduce(
      (acc, cur) => acc + (cur ? 0 : 1),
      0
    ) >= 4

  return (
    <div className="mt-5">
      {threshold && (
        <Link href="/settings#table-settings">
          <div className="flex items-center gap-1 text-sm text-secondary">
            <InfoIcon className="h-4 w-4" />
            Hey, you hid some information in your table. Click here to edit.
          </div>
        </Link>
      )}
    </div>
  )
}
