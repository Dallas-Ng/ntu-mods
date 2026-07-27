"use client"

import { useState } from "react"
import {
  Calendar,
  Copy,
  Download,
  ImageDown,
  Link as LinkIcon,
  MoreHorizontal
} from "lucide-react"
import posthog from "posthog-js"
import { toast } from "sonner"

import { getIcs } from "@/lib/get-ics"
import { latestSemester, latestYear } from "@/lib/semesters"
import { useAllModules } from "@/hooks/use-all-modules"
import { useCustomCourses } from "@/hooks/use-custom-courses"
import { useSeasonIndexes } from "@/hooks/use-season-indexes"
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

const TimetableActionsDropdown = () => {
  const { timetable, timetables, timetableIndex, duplicateTimetable } =
    useTimetable()
  const { customCourses } = useCustomCourses()
  const year = latestYear
  const semester = latestSemester
  const { indexes: seasonIndexes } = useSeasonIndexes(year, semester)
  const { modules } = useAllModules()
  const [calendarLoading, setCalendarLoading] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)

  const handleDownloadCalendar = async () => {
    if (Object.keys(timetable).length === 0) {
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
        <DropdownMenuItem
          onClick={() => setShareOpen(true)}
          className="gap-2">
          <LinkIcon className="size-4" />
          Share
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setImportOpen(true)}
          className="gap-2">
          <Download className="size-4" />
          Import from text
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
    </>
  )
}

export default TimetableActionsDropdown
