"use client"

import { useState } from "react"
import { useBoundState } from "@/state/bound.state"
import {
  Calendar,
  Copy,
  Download,
  ImageDown,
  Link as LinkIcon,
  MoreHorizontal,
  MousePointerClick
} from "lucide-react"
import posthog from "posthog-js"
import { toast } from "sonner"

import { customCoursesToIcsInputs } from "@/lib/custom-course-to-index"
import { getIcs } from "@/lib/get-ics"
import { latestSemester, latestYear } from "@/lib/semesters"
import { cn } from "@/lib/utils"
import { useAllModules } from "@/hooks/use-all-modules"
import { useCustomCourses } from "@/hooks/use-custom-courses"
import { useSeasonIndexes } from "@/hooks/use-season-indexes"
import { useSettings } from "@/hooks/use-settings"
import { useTimetable } from "@/hooks/use-timetable"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

import TimetableImportDialog from "./timetable-import-dialog"
import TimetableShareDialog from "./timetable-share-dialog"

interface Props {
  indexPickerEnabled: boolean
  onToggleIndexPicker: () => void
}

const TimetableActionsDropdown = ({
  indexPickerEnabled,
  onToggleIndexPicker
}: Props) => {
  const { timetable, timetables, timetableIndex, duplicateTimetable } =
    useTimetable()
  const { customCourses } = useCustomCourses()
  const year = latestYear
  const semester = latestSemester
  const { indexes: seasonIndexes } = useSeasonIndexes(year, semester)
  const { modules } = useAllModules()
  const { settings } = useSettings()
  const moduleRemarks = useBoundState((s) => s.moduleRemarks)
  const indexRemarks = useBoundState((s) => s.indexRemarks)
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  const handleDownloadCalendar = async () => {
    if (Object.keys(timetable).length === 0 && customCourses.length === 0) {
      toast.info("Please fill up your timetable first")
      return
    }

    setCalendarLoading(true)

    try {
      const indexLookup: Record<string, Index[]> = {}
      for (const [moduleCode, indexKey] of Object.entries(timetable)) {
        const slots = seasonIndexes[moduleCode]?.[indexKey]
        if (slots) indexLookup[indexKey] = slots
      }

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

      posthog.capture("calendar_downloaded", {
        module_count: Object.keys(timetable).length
      })
    } catch {
      toast.error("Something went wrong, please try again later")
    }

    setCalendarLoading(false)
  }

  const handleDuplicate = (toIndex: number) => {
    duplicateTimetable(timetableIndex, toIndex)
    posthog.capture("timetable_plan_duplicated", {
      from_plan: timetableIndex + 1,
      to_plan: toIndex + 1
    })
    toast(`Duplicated to Plan ${toIndex + 1}`)
  }

  return (
    <>
      <TimetableShareDialog
        open={shareOpen}
        onOpenChange={setShareOpen}
        timetable={timetable}
        customCourses={customCourses}
      />
      <TimetableImportDialog open={importOpen} onOpenChange={setImportOpen} />

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <MoreHorizontal className="size-4" />
            <span className="sr-only">More actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="gap-2">
              <Copy className="size-4" />
              Duplicate to Plan
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {timetables.map((_, index) => {
                if (index === timetableIndex) return null
                return (
                  <DropdownMenuItem
                    key={index}
                    onClick={() => handleDuplicate(index)}>
                    Plan {index + 1}
                  </DropdownMenuItem>
                )
              })}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator />
          {/* Bringing data in, grouped apart from the send-it-out actions
              below — opposite direction, shouldn't share a group. */}
          <DropdownMenuItem
            onClick={() => setImportOpen(true)}
            className="gap-2">
            <Download className="size-4" />
            Import from text
          </DropdownMenuItem>

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShareOpen(true)}
            className="gap-2">
            <LinkIcon className="size-4" />
            Share
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <a href="/screenshot" className="flex items-center gap-2">
              <ImageDown className="size-4" />
              Export as Image
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={handleDownloadCalendar}
            disabled={calendarLoading}
            className="gap-2">
            <Calendar className="size-4" />
            Save to Calendar
          </DropdownMenuItem>

          {/* Separator marks the line between navigation/actions above and
              a feature toggle below — same menu, different kind of item. */}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onToggleIndexPicker}
            className={cn(
              "gap-2",
              indexPickerEnabled &&
                "bg-primary/10 text-primary focus:bg-primary/15 focus:text-primary"
            )}>
            <MousePointerClick className="size-4" />
            {indexPickerEnabled ? "Stop picking indexes" : "Pick indexes"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}

export default TimetableActionsDropdown
