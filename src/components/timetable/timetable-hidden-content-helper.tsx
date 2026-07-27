"use client"

import { InfoIcon } from "lucide-react"

import { useSettings } from "@/hooks/use-settings"

const TimetableHiddenContentHelper = () => {
  const { settings } = useSettings()

  const threshold =
    Object.values(settings.tableCell).reduce((a, c) => a + Number(c), 0) <= 4

  return (
    <>
      {threshold && (
        <a href="/settings#table-settings">
          <div className="text-muted-foreground flex items-start gap-1 text-sm hover:underline md:items-center">
            <span>
              <InfoIcon className="size-5" />
            </span>
            Some information are hidden in your table. Click to edit.
          </div>
        </a>
      )}
    </>
  )
}

export default TimetableHiddenContentHelper
