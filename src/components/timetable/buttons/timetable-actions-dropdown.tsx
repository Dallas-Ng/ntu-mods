"use client"

import { useState } from "react"
import Link from "next/link"
import {
  Calendar,
  ImageDown,
  Link as LinkIcon,
  MoreHorizontal
} from "lucide-react"
import posthog from "posthog-js"
import { toast } from "sonner"

import { BASE_URL } from "@/lib/constants"
import { latestSemester, latestYear } from "@/lib/semesters"
import { getIcs } from "@/lib/get-ics"
import { useAllModules } from "@/hooks/use-all-modules"
import { useSeasonIndexes } from "@/hooks/use-season-indexes"
import { useTimetable } from "@/hooks/use-timetable"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

const TimetableActionsDropdown = () => {
  const { timetable } = useTimetable()
  const year = latestYear
  const semester = latestSemester
  const { indexes: seasonIndexes } = useSeasonIndexes(year, semester)
  const { modules } = useAllModules()
  const [calendarLoading, setCalendarLoading] = useState(false)

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

  const handleShare = () => {
    const urlParams = new URLSearchParams(timetable)
    const link = `${BASE_URL}/share?${urlParams.toString()}`
    const isMobile = /Mobi|Android/i.test(navigator.userAgent)

    if (isMobile && navigator.share) {
      posthog.capture("timetable_shared", {
        method: "native_share",
        module_count: Object.keys(timetable).length
      })
      navigator
        .share({
          title: "Look at my timetable from NTU Mods",
          text: "You can use this to plan your mods too!",
          url: link
        })
        .catch(() => {
          navigator.clipboard.writeText(link)
          toast("Share link copied to clipboard")
        })
      return
    }

    posthog.capture("timetable_shared", {
      method: "clipboard",
      module_count: Object.keys(timetable).length
    })
    navigator.clipboard.writeText(link)
    toast("Share link copied to clipboard")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <MoreHorizontal className="size-4" />
          <span className="sr-only">More actions</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href="/screenshot" className="flex items-center gap-2">
            <ImageDown className="size-4" />
            Export as Image
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleDownloadCalendar}
          disabled={calendarLoading}
          className="gap-2">
          <Calendar className="size-4" />
          Save to Calendar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleShare} className="gap-2">
          <LinkIcon className="size-4" />
          Share
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export default TimetableActionsDropdown
