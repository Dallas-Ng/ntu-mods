"use client"

import { useState } from "react"
import { useBoundState } from "@/state/bound.state"
import { Calendar } from "lucide-react"
import { toast } from "sonner"

import { reportError, track } from "@/lib/analytics"
import { customCoursesToIcsInputs } from "@/lib/custom-course-to-index"
import { getIcs } from "@/lib/get-ics"
import { latestSemester, latestYear } from "@/lib/semesters"
import { useAllModules } from "@/hooks/use-all-modules"
import { useCustomCourses } from "@/hooks/use-custom-courses"
import { useSeasonIndexes } from "@/hooks/use-season-indexes"
import { useSettings } from "@/hooks/use-settings"
import { useTimetable } from "@/hooks/use-timetable"
import ButtonCollapsable from "@/components/button-collapsable"

import TimetableCalendarDialog from "./timetable-calendar-dialog"

const TimetableDownloadCalendarButton = ({
  labelled
}: {
  /** Show the label on phones too, stretching to share the row. */
  labelled?: boolean
}) => {
  const { timetable } = useTimetable()
  const year = latestYear
  const semester = latestSemester
  const { indexes: seasonIndexes } = useSeasonIndexes(year, semester)
  const { modules } = useAllModules()
  const { customCourses } = useCustomCourses()
  const { settings } = useSettings()
  const moduleRemarks = useBoundState((s) => s.moduleRemarks)
  const indexRemarks = useBoundState((s) => s.indexRemarks)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const isEmpty =
    Object.keys(timetable).length === 0 && customCourses.length === 0

  // Explains the file first; the download happens from the dialog.
  const openDialog = () => {
    if (isEmpty) {
      toast.info("Add modules to your timetable first")
      return
    }
    setOpen(true)
  }

  const handleDownload = async () => {
    if (isEmpty) return

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
        indexRemarks
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
      track("calendar_downloaded", {
        module_count: Object.keys(timetable).length,
        source: "standalone_button"
      })
    } catch (e) {
      reportError("calendar_download", e)
      toast.error("Something went wrong. Try again later.")
    }

    setLoading(false)
  }

  return (
    <>
      <ButtonCollapsable
        onClick={openDialog}
        icon={Calendar}
        text={
          labelled ? (
            <>
              <span className="sm:hidden">Calendar</span>
              <span className="hidden sm:inline">Save to Calendar</span>
            </>
          ) : (
            "Save to Calendar"
          )
        }
        aria-label="Save to Calendar"
        labelled={labelled}
        className={labelled ? "flex-1 sm:flex-none" : undefined}
      />
      <TimetableCalendarDialog
        open={open}
        onOpenChange={setOpen}
        loading={loading}
        onDownload={handleDownload}
      />
    </>
  )
}

export default TimetableDownloadCalendarButton
