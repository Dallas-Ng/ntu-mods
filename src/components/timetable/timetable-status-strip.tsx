"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  AlertTriangleIcon,
  Calendar,
  ImageDown,
  LinkIcon
} from "lucide-react"
import posthog from "posthog-js"
import { toast } from "sonner"

import { BASE_URL } from "@/lib/constants"
import { TRUN_DAY_MAP } from "@/lib/constants"
import { getIcs } from "@/lib/get-ics"
import { latestSemester, latestYear } from "@/lib/semesters"
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

const TimetableStatusStrip = () => {
  const { timetable } = useTimetable()
  const year = latestYear
  const semester = latestSemester
  const { modules } = useAllModules()
  const { indexes: seasonIndexes } = useSeasonIndexes(year, semester)
  const [examMap, setExamMap] = useState<
    Record<string, { date: string; start_time: string; end_time: string }>
  >({})
  const [calendarLoading, setCalendarLoading] = useState(false)

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/data/api/exams/${year}_${semester}.json`, {
      signal: controller.signal
    })
      .then((res) => (res.ok ? res.json() : {}))
      .then((data) => setExamMap(data ?? {}))
      .catch(() => setExamMap({}))
    return () => controller.abort()
  }, [year, semester])

  const moduleMetaMap = Object.fromEntries(
    modules
      .filter((m) => timetable[m.code])
      .map((m) => [m.code, { title: m.title, au: m.au }])
  )

  const totalAU = Object.keys(timetable)
    .reduce((acc, moduleKey) => {
      const au = parseFloat(moduleMetaMap[moduleKey]?.au ?? "0") || 0
      return acc + au
    }, 0)
    .toFixed(1)

  // Compute exam clashes
  const examDates = Object.entries(timetable)
    .map(([moduleKey]) => examMap[moduleKey]?.date)
    .filter(Boolean) as string[]
  const examDateCounts = examDates.reduce(
    (acc, date) => {
      acc[date] = (acc[date] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>
  )
  const examClashCount = Object.values(examDateCounts).filter(
    (c) => c > 1
  ).length

  // Compute free days
  const daysWithClass = new Set<number>()
  for (const [moduleKey, indexKey] of Object.entries(timetable)) {
    const slots = seasonIndexes[moduleKey]?.[indexKey] ?? []
    for (const slot of slots) {
      if (slot.day >= 1 && slot.day <= 5) daysWithClass.add(slot.day)
    }
  }
  const freeDayNums = [1, 2, 3, 4, 5].filter((d) => !daysWithClass.has(d))
  const freeDayCount = freeDayNums.length

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

  const hasModules = Object.keys(timetable).length > 0

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border px-3 py-2 text-sm">
      <span className="font-medium">{totalAU} AU</span>

      {examClashCount > 0 && (
        <span className="text-destructive flex items-center gap-1 font-medium">
          <AlertTriangleIcon className="size-3.5" />
          {examClashCount} exam clash{examClashCount !== 1 ? "es" : ""}
        </span>
      )}

      {hasModules && freeDayCount > 0 && (
        <span className="text-muted-foreground flex items-center gap-1">
          <span className="font-medium text-foreground">
            {freeDayCount} free day{freeDayCount !== 1 ? "s" : ""}
          </span>
          <span className="hidden sm:inline">
            ·{" "}
            {freeDayNums
              .map((d) => TRUN_DAY_MAP[d as keyof typeof TRUN_DAY_MAP])
              .join(" · ")}
          </span>
        </span>
      )}

      <div className="ml-auto flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              Export
              <span className="text-muted-foreground">▾</span>
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
              Copy Share Link
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export default TimetableStatusStrip
