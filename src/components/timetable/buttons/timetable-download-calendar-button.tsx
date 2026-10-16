"use client"

import { useState } from "react"
import { useBoundState } from "@/state/bound.state"
import { Calendar } from "lucide-react"
import posthog from "posthog-js"
import { toast } from "sonner"

import { customCoursesToIcsInputs } from "@/lib/custom-course-to-index"
import { getIcs } from "@/lib/get-ics"
import { useAllModules } from "@/hooks/use-all-modules"
import { useCustomCourses } from "@/hooks/use-custom-courses"
import { useSeasonIndexes } from "@/hooks/use-season-indexes"
import { useSelectedSemester } from "@/hooks/use-selected-semester"
import { useSettings } from "@/hooks/use-settings"
import { useTimetable } from "@/hooks/use-timetable"
import ButtonCollapsable from "@/components/button-collapsable"

const TimetableDownloadCalendarButton = () => {
  const { timetable } = useTimetable()
  const { year, semester } = useSelectedSemester()
  const { indexes: seasonIndexes } = useSeasonIndexes(year, semester)
  const { modules } = useAllModules()
  const { customCourses } = useCustomCourses()
  const { settings } = useSettings()
  const moduleRemarks = useBoundState((s) => s.moduleRemarks)
  const indexRemarks = useBoundState((s) => s.indexRemarks)
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (Object.keys(timetable).length === 0 && customCourses.length === 0) {
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

      // Merge in custom blocks (gym, CCA, etc.)
      const customIcs = customCoursesToIcsInputs(customCourses)
      Object.assign(indexLookup, customIcs.indexLookup)
      Object.assign(titleLookup, customIcs.titleLookup)

      const icsText = getIcs(
        { ...timetable, ...customIcs.timetable },
        indexLookup,
        titleLookup,
        settings.tableCell,
        customIcs.labelLookup,
        moduleRemarks,
        indexRemarks,
        `${year};${semester}`
      )

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
      posthog.capture("calendar_downloaded", {
        module_count: Object.keys(timetable).length,
        source: "standalone_button"
      })
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
