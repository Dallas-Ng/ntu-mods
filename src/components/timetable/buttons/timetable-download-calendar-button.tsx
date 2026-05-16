"use client"

import { useState } from "react"
import { Calendar } from "lucide-react"
import { toast } from "sonner"

import { getIcs } from "@/lib/get-ics"
import { useAllModules } from "@/hooks/use-all-modules"
import { useLatestSemester } from "@/hooks/use-latest-semester"
import { useSeasonIndexes } from "@/hooks/use-season-indexes"
import { useTimetable } from "@/hooks/use-timetable"
import ButtonCollapsable from "@/components/button-collapsable"

const TimetableDownloadCalendarButton = () => {
  const { timetable } = useTimetable()
  const { year, semester } = useLatestSemester()
  const { indexes: seasonIndexes } = useSeasonIndexes(year, semester)
  const { modules } = useAllModules()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (Object.keys(timetable).length === 0) {
      toast.info("Please fill up your timetable first")
      return
    }

    setLoading(true)

    try {
      // Build indexLookup: { indexKey -> Index[] } for selected timetable entries
      const indexLookup: Record<string, Index[]> = {}
      for (const [moduleCode, indexKey] of Object.entries(timetable)) {
        const slots = seasonIndexes[moduleCode]?.[indexKey]
        if (slots) indexLookup[indexKey] = slots
      }

      // Build titleLookup: { moduleCode -> title }
      const titleLookup: Record<string, string> = {}
      for (const m of modules) {
        if (timetable[m.code]) titleLookup[m.code] = m.title
      }

      const icsText = getIcs(timetable, indexLookup, titleLookup)

      if (!icsText) throw new Error("Failed to generate calendar")

      const blob = new Blob([icsText], { type: "text/calendar" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = "ntu_mods_timetable.ics"
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      toast.error("Something went wrong, please try again later")
    }

    setLoading(false)
  }

  return (
    <ButtonCollapsable
      onClick={handleClick}
      disabled={loading}
      icon={Calendar}
      text="Save to Calendar"
    />
  )
}

export default TimetableDownloadCalendarButton
