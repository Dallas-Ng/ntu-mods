"use client"

import { useState } from "react"
import { InfoIcon } from "lucide-react"

import { useSettings } from "@/hooks/use-settings"

import TimetableSettingsDialog from "./buttons/timetable-settings-dialog"

const TimetableHiddenContentHelper = () => {
  const { settings } = useSettings()
  const [open, setOpen] = useState(false)

  const threshold =
    Object.values(settings.tableCell).reduce((a, c) => a + Number(c), 0) <= 4

  if (!threshold) return null

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-muted-foreground flex items-start gap-1 text-left text-xs hover:underline md:items-center">
        <span>
          <InfoIcon className="size-3" />
        </span>
        Some information is hidden in your table. Open the table settings to
        show more.
      </button>
      <TimetableSettingsDialog open={open} onOpenChange={setOpen} />
    </>
  )
}

export default TimetableHiddenContentHelper
