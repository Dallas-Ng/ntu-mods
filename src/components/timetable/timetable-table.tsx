"use client"

import { useEffect, useMemo, useState } from "react"

import { latestSemester, latestYear } from "@/lib/semesters"
import { useTimetable } from "@/hooks/use-timetable"
import { useTimetableIndexes } from "@/hooks/use-timetable-indexes"

import { TimetableTable } from "../timetable-table/table"
import { TimetableTableLoader } from "../timetable-table/table-loader"

interface Props {
  timetable?: Timetable
}

const TimetablePageTable = ({ timetable: timetableProp }: Props) => {
  const indexPickerEnabled = true
  const { timetable, updateItemIndex } = useTimetable(timetableProp)
  const year = latestYear
  const semester = latestSemester
  const [activeModuleKey, setActiveModuleKey] = useState<string | null>(null)
  const { moduleIndexMap, allModuleIndexes, isLoading } = useTimetableIndexes(
    timetable,
    year,
    semester
  )

  useEffect(() => {
    if (activeModuleKey && !timetable[activeModuleKey]) {
      setActiveModuleKey(null)
    }
  }, [activeModuleKey, timetable])

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

  const activeIndexKey = activeModuleKey
    ? timetable[activeModuleKey]
    : undefined

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
            updateItemIndex(moduleKey, indexKey)
            setActiveModuleKey(null)
          }
        }}
      />
    </div>
  )
}

export default TimetablePageTable
