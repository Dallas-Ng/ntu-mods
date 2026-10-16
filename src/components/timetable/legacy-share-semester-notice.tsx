"use client"

import { useEffect, useRef, useState } from "react"

import { bestMatchSemester } from "@/lib/semester-match"
import {
  SELECTABLE_SEMESTERS,
  semesterLabelShort,
  splitSemester
} from "@/lib/semesters"
import {
  SEMESTER_PARAM,
  semesterFromParam,
  semesterToParam
} from "@/lib/timetable-share"
import { replaceSearchParams, useSearchParams } from "@/hooks/use-search-params"
import { fetchSeasonIndexes } from "@/hooks/use-season-indexes"
import { useTimetable } from "@/hooks/use-timetable"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

/**
 * Links made before plans were per-semester have no `sem`. Place the timetable
 * in the semester whose indexes it fits, say so, and let the viewer flip it.
 */
const LegacyShareSemesterNotice = () => {
  const searchParams = useSearchParams()
  const { qsTimetable } = useTimetable()
  const [matched, setMatched] = useState<string | null>(null)
  const started = useRef(false)

  const needsMatch =
    qsTimetable !== undefined &&
    Object.keys(qsTimetable).length > 0 &&
    !searchParams.has(SEMESTER_PARAM)

  const setSemester = (semester: string) => {
    const next = new URLSearchParams(window.location.search)
    next.set(SEMESTER_PARAM, semesterToParam(semester))
    replaceSearchParams(window.location.pathname, next.toString())
  }

  useEffect(() => {
    if (!needsMatch || started.current || !qsTimetable) return
    started.current = true
    Promise.all(
      SELECTABLE_SEMESTERS.map(async (semester) => {
        const [year, term] = splitSemester(semester)
        return [semester, await fetchSeasonIndexes(year, term)] as const
      })
    ).then((entries) => {
      const semester = bestMatchSemester(
        [qsTimetable],
        Object.fromEntries(entries),
        SELECTABLE_SEMESTERS
      )
      setMatched(semester)
      setSemester(semester)
    })
  }, [needsMatch, qsTimetable])

  if (!matched) return null

  // Follow the URL so "Show as ..." keeps offering the semester not shown
  const shown = semesterFromParam(searchParams.get(SEMESTER_PARAM)) ?? matched
  const other = SELECTABLE_SEMESTERS.find((s) => s !== shown)

  return (
    <Alert>
      <AlertDescription className="flex flex-wrap items-center gap-2">
        <span>
          This link doesn&apos;t say which semester it&apos;s for. We matched it
          to {semesterLabelShort(shown)}.
        </span>
        {other && (
          <Button
            size="xs"
            variant="outline"
            onClick={() => setSemester(other)}>
            Show as {semesterLabelShort(other)}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}

export default LegacyShareSemesterNotice
