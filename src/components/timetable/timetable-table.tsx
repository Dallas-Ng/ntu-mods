"use client"

import { useEffect, useMemo, useState } from "react"
import { MousePointerClick } from "lucide-react"

import { cn } from "@/lib/utils"
import { useLatestSemester } from "@/hooks/use-latest-semester"
import { useTimetable } from "@/hooks/use-timetable"
import { useTimetableIndexes } from "@/hooks/use-timetable-indexes"

import { TimetableTableLoader } from "../timetable-table/table-loader"
import { TimetableTable } from "../timetable-table/table"
import { Button } from "../ui/button"

interface Props {
  timetable?: Timetable
}

const TimetablePageTable = (props: Props) => {
  const { timetable, updateItemIndex } = useTimetable(props.timetable)
  const { year, semester } = useLatestSemester()
  const [indexPickerEnabled, setIndexPickerEnabled] = useState(false)
  const [activeModuleKey, setActiveModuleKey] = useState<string | null>(null)
  const { moduleIndexMap, allModuleIndexes, isLoading } = useTimetableIndexes(
    timetable,
    year,
    semester
  )

  useEffect(() => {
    if (!indexPickerEnabled) {
      setActiveModuleKey(null)
      return
    }

    if (activeModuleKey && !timetable[activeModuleKey]) {
      setActiveModuleKey(null)
    }
  }, [activeModuleKey, indexPickerEnabled, timetable])

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
  const alternativeIndexCount =
    activeModuleKey && allModuleIndexes[activeModuleKey]
      ? Math.max(Object.keys(allModuleIndexes[activeModuleKey]).length - 1, 0)
      : 0

  if (isLoading && !Object.keys(moduleIndexMap).length) {
    return <TimetableTableLoader />
  }

  return (
    <div className="space-y-2">
      <div className="bg-card flex flex-col gap-2 rounded-md border p-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-muted-foreground min-w-0 text-xs">
          <p className="text-foreground font-medium">Quick index switching</p>
          <p>
            {indexPickerEnabled
              ? activeModuleKey
                ? `${activeModuleKey}: ${alternativeIndexCount} other indexes available`
                : "Click a timetable block to show its other indexes"
              : "Enable this to pick indexes directly from the timetable"}
          </p>
        </div>

        <Button
          type="button"
          variant={indexPickerEnabled ? "default" : "outline"}
          size="sm"
          className={cn("shrink-0 gap-2", indexPickerEnabled && "shadow-none")}
          onClick={() => setIndexPickerEnabled((value) => !value)}>
          <MousePointerClick className="size-4" />
          Click to see indexes
        </Button>
      </div>

      <TimetableTable
        moduleIndexMap={previewModuleIndexMap}
        indexPicker={{
          enabled: indexPickerEnabled,
          activeModuleKey,
          activeIndexKey,
          onActiveModuleChange: setActiveModuleKey,
          onIndexSelect: (moduleKey, indexKey) => {
            updateItemIndex(moduleKey, indexKey)
            setActiveModuleKey(moduleKey)
          }
        }}
      />
    </div>
  )
}

export default TimetablePageTable
