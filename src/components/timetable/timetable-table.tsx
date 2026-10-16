"use client"

import { useEffect, useMemo, useState } from "react"
import { useBoundState } from "@/state/bound.state"

import {
  customCourseIdFromKey,
  isCustomCourseKey
} from "@/lib/custom-course-colors"
import { useCustomCourses } from "@/hooks/use-custom-courses"
import { useSelectedSemester } from "@/hooks/use-selected-semester"
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
  const { year, semester } = useSelectedSemester()
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

  const previewModuleIndexMap = useMemo(() => {
    if (!indexPickerEnabled || !activeModuleKey) return moduleIndexMap

    const activeModuleIndexes = allModuleIndexes[activeModuleKey]
    if (!activeModuleIndexes) return moduleIndexMap

    const allSlots = Object.values(activeModuleIndexes).flat()
    if (!allSlots.length) return moduleIndexMap

    return {
      ...moduleIndexMap,
      [activeModuleKey]: allSlots
    }
  }, [activeModuleKey, allModuleIndexes, indexPickerEnabled, moduleIndexMap])

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

  return (
    <div className="space-y-2">
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
