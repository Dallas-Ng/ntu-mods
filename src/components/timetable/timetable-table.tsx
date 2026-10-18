"use client"

import { useEffect, useMemo, useState } from "react"
import { useBoundState } from "@/state/bound.state"
import { useIndexHover } from "@/state/index-hover.state"

import {
  customCourseIdFromKey,
  isCustomCourseKey
} from "@/lib/custom-course-colors"
import { latestSemester, latestYear } from "@/lib/semesters"
import { useCustomCourses } from "@/hooks/use-custom-courses"
import { useTimetable } from "@/hooks/use-timetable"
import { useTimetableIndexes } from "@/hooks/use-timetable-indexes"

import { TimetableTable } from "../timetable-table/table"
import { TimetableTableLoader } from "../timetable-table/table-loader"

interface Props {
  timetable?: Timetable
  indexPickerEnabled?: boolean
}

const TimetablePageTable = ({
  timetable: timetableProp,
  indexPickerEnabled = false
}: Props) => {
  const { timetable, updateItemIndex } = useTimetable(timetableProp)
  const year = latestYear
  const semester = latestSemester
  const [activeModuleKey, setActiveModuleKey] = useState<string | null>(null)
  const { moduleIndexMap, allModuleIndexes, isLoading } = useTimetableIndexes(
    timetable,
    year,
    semester
  )
  const { customCourses } = useCustomCourses()
  const selectCustomCourseIndex = useBoundState(
    (s) => s.selectCustomCourseIndex
  )

  useEffect(() => {
    if (!indexPickerEnabled) {
      setActiveModuleKey(null)
      return
    }

    if (!activeModuleKey) return

    const stillPresent = isCustomCourseKey(activeModuleKey)
      ? customCourses.some(
          (c) => c.id === customCourseIdFromKey(activeModuleKey)
        )
      : Boolean(timetable[activeModuleKey])

    if (!stillPresent) setActiveModuleKey(null)
  }, [activeModuleKey, indexPickerEnabled, timetable, customCourses])

  const hovered = useIndexHover((s) => s.hovered)

  const previewModuleIndexMap = useMemo(() => {
    const hoveredSlots =
      hovered && allModuleIndexes[hovered.moduleKey]?.[hovered.indexKey]
    if (hovered && hoveredSlots?.length)
      return {
        ...moduleIndexMap,
        [hovered.moduleKey]:
          hovered.indexKey === hovered.currentKey
            ? hoveredSlots
            : [...(moduleIndexMap[hovered.moduleKey] ?? []), ...hoveredSlots]
      }

    if (!indexPickerEnabled || !activeModuleKey) return moduleIndexMap

    const activeModuleIndexes = allModuleIndexes[activeModuleKey]
    if (!activeModuleIndexes) return moduleIndexMap

    const allSlots = Object.values(activeModuleIndexes).flat()
    if (!allSlots.length) return moduleIndexMap

    return {
      ...moduleIndexMap,
      [activeModuleKey]: allSlots
    }
  }, [
    activeModuleKey,
    allModuleIndexes,
    hovered,
    indexPickerEnabled,
    moduleIndexMap
  ])

  const activeIndexKey = !activeModuleKey
    ? undefined
    : isCustomCourseKey(activeModuleKey)
      ? customCourses.find(
          (c) => c.id === customCourseIdFromKey(activeModuleKey)
        )?.selectedIndexId
      : timetable[activeModuleKey]

  if (isLoading && !Object.keys(moduleIndexMap).length) {
    return <TimetableTableLoader />
  }

  const showHoverLegend =
    hovered && hovered.currentKey && hovered.currentKey !== hovered.indexKey

  return (
    <div className="space-y-2">
      {showHoverLegend && (
        // Zero-height sticky anchor so the pill follows scroll without
        // pushing the table down when it appears.
        <div className="pointer-events-none sticky top-16 z-30 h-0">
          <div className="bg-background/95 absolute top-7 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full border px-3 py-1 text-xs shadow-md">
            <span className="flex items-center gap-1.5">
              <span className="outline-foreground/50 size-3 rounded-[3px] outline-2 -outline-offset-1" />
              Current {hovered.currentKey}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="outline-primary size-3 rounded-[3px] outline-2 -outline-offset-1 outline-dashed" />
              Preview {hovered.indexKey}
            </span>
          </div>
        </div>
      )}
      <TimetableTable
        moduleIndexMap={previewModuleIndexMap}
        indexPicker={{
          enabled: indexPickerEnabled,
          activeModuleKey,
          activeIndexKey,
          onActiveModuleChange: setActiveModuleKey,
          onIndexSelect: (moduleKey, indexKey) => {
            if (isCustomCourseKey(moduleKey)) {
              selectCustomCourseIndex(
                customCourseIdFromKey(moduleKey),
                indexKey
              )
            } else {
              updateItemIndex(moduleKey, indexKey)
            }
            setActiveModuleKey(null)
          }
        }}
      />
    </div>
  )
}

export default TimetablePageTable
