"use client"

import { useEffect, useState } from "react"

import { getAllAcademicYearCalendars } from "@/lib/academic-calendar"
import { calendarStatus } from "@/lib/academic-calendar-events"
import { formatDayMonth } from "@/lib/calendar-format"
import { singaporeToday } from "@/components/calendar/singapore-today"

/** Public/data/api/status.json, written by scripts/build-static-data.mts. */
export interface DataStatus {
  year: string
  semester: string
  modules: number
  indexes: number
  exams: { year: string; semester: string; count: number }[]
  /** When the course data last changed (YYYY-MM-DD), if the build knew. */
  updated?: string
  /** This semester's modules per type, keyed like MODULE_CATEGORY. */
  categories: Record<string, number>
}

// One request per page load, shared by every menu that shows a number. A
// failed request is forgotten so the next open tries again.
let statusPromise: Promise<DataStatus> | null = null

export const loadDataStatus = () =>
  (statusPromise ??= fetch("/data/api/status.json").then((res) => {
    if (!res.ok) throw new Error(`status.json ${res.status}`)
    return res.json() as Promise<DataStatus>
  })).catch((error) => {
    statusPromise = null
    throw error
  })

/**
 * The status once loaded, null before then or on failure. Only mount it where
 * the numbers are on screen: menus mount their content on open, so the file is
 * fetched the first time one is looked at.
 */
export function useDataStatus() {
  const [status, setStatus] = useState<DataStatus | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let live = true
    loadDataStatus()
      .then((s) => live && setStatus(s))
      .catch(() => live && setFailed(true))
    return () => {
      live = false
    }
  }, [])
  return { status, failed }
}

export const formatCount = (value: number) => value.toLocaleString("en-US")

const termName = (code: string) => {
  const term = code.split(";")[1]
  return term === "S" || term === "T" ? "Special Term" : `S${term}`
}

/**
 * Where `today` falls in NTU's published calendar, as one line: "Teaching week
 * 5", "Recess week", "Exams", "S2 starts 11 Jan". Null when no calendar covers
 * it. Same source as /calendar (calendarStatus).
 */
export const semesterWeekLabel = (today: string): string | null => {
  const status = calendarStatus(getAllAcademicYearCalendars(), today)
  switch (status.kind) {
    case "teaching":
      return `Teaching week ${status.week}`
    case "recess":
      return "Recess week"
    case "exams":
      return "Exams"
    case "between":
      return status.next
        ? `${termName(status.next.semester)} starts ${formatDayMonth(status.next.start)}`
        : null
  }
}

/**
 * Where the semester is today ("Teaching week 5"), set after mount so the
 * server render and the first client render agree.
 */
export function useSemesterWeek() {
  const [week, setWeek] = useState<string | null>(null)
  useEffect(() => setWeek(semesterWeekLabel(singaporeToday())), [])
  return week
}

/**
 * "Updated today", "Updated yesterday" or "Updated 3 days ago" for a YYYY-MM-DD
 * date, counted in Singapore calendar days. Set after mount, like
 * useSemesterWeek.
 */
export function useUpdatedLabel(isoDate: string | undefined) {
  const [label, setLabel] = useState<string | null>(null)
  useEffect(() => {
    if (!isoDate) return setLabel(null)
    const today = new Date().toLocaleDateString("en-CA", {
      timeZone: "Asia/Singapore"
    })
    const days = Math.round(
      (Date.parse(today) - Date.parse(isoDate)) / (24 * 60 * 60 * 1000)
    )
    setLabel(
      days <= 0
        ? "Updated today"
        : days === 1
          ? "Updated yesterday"
          : `Updated ${days} days ago`
    )
  }, [isoDate])
  return label
}
