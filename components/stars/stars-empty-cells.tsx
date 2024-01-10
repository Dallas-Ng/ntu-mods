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
          <div className="flex items-start gap-1 text-sm text-secondary hover:underline md:items-center">
            <span>
              <InfoIcon className="h-5 w-5" />
            </span>
            Some information are hidden in your table.{" "}
            <br className="block md:hidden" />
            Click to edit.
          </div>
        </Link>
      )}
    </div>
  )
}
