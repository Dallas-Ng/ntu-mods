"use client"

import Link from "next/link"
import { InfoIcon } from "lucide-react"

import { useSettings } from "@/hooks/use-settings"

const TimetableHiddenContentHelper = () => {
  const { settings } = useSettings()

  const threshold =
    Object.values(settings.tableCell).reduce((a, c) => a + Number(c), 0) <= 4

  return (
    <>
      {threshold && (
        <Link href="/settings#table-settings">
          <div className="flex items-start gap-1 text-sm text-muted-foreground hover:underline md:items-center">
            <span>
              <InfoIcon className="size-5" />
            </span>
            Some information are hidden in your table. Click to edit.
          </div>
        </Link>
      )}
    </>
  )
}

export default TimetableHiddenContentHelper
