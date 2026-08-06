"use client"

import { Fragment, useMemo, useState } from "react"

import { TABLE_SETTINGS } from "@/config/table-settings"
import { STARS_TIMESLOTS } from "@/lib/constants"
import {
  generateTimetableMatrix,
  getFirstTsIndex
} from "@/lib/generate-timetable-matrix"
import { getIndexType } from "@/lib/get-index-type"
import { cn } from "@/lib/utils"
import { useSettings } from "@/hooks/use-settings"
import { TooltipProvider } from "@/components/ui/tooltip"

import { TimetableTableCell } from "./cell"
import { TimeSlotItem } from "./table-loader"
import { TimetableTableThead } from "./thead"

export interface PrecomputedTimetableMatrix {
  TABLE_MATRIX: { [tsIndex: number]: Index[][] }
  TABLE_MAX_DAY_COLUMNS: { [dayIndex: number]: number }
}

interface Props {
  moduleIndexMap: TimetableWithIndex
  hideIndex?: boolean
  fullCell?: boolean
  showModuleKeyAsCommon?: boolean
  alwaysHighlightLectures?: boolean
  precomputedMatrix?: PrecomputedTimetableMatrix
  indexPicker?: {
    enabled: boolean
    activeModuleKey: string | null
    activeIndexKey?: string
    onActiveModuleChange: (moduleKey: string) => void
    onIndexSelect: (moduleKey: string, indexKey: string) => void
  }
}

const cloneModuleIndexMap = (moduleIndexMap: TimetableWithIndex) =>
  Object.fromEntries(
    Object.entries(moduleIndexMap).map(([moduleKey, indexes]) => [
      moduleKey,
      [...indexes]
    ])
  ) as TimetableWithIndex

export const TimetableTable = (props: Props) => {
  const {
    moduleIndexMap,
    hideIndex = false,
    fullCell = false,
    showModuleKeyAsCommon = false,
    alwaysHighlightLectures = false,
    precomputedMatrix,
    indexPicker
  } = props
  const { isMobile, settings } = useSettings()
  const { fullSizeBlocks, standardisedScale } = settings
  const rowHeightStyle = standardisedScale
    ? { height: TABLE_SETTINGS.ROW_HEIGHT_PX }
    : fullSizeBlocks
      ? { minHeight: TABLE_SETTINGS.ROW_HEIGHT_PX }
      : undefined
  // Standardised scale needs every row locked to the same height even when
  // a cell's own text would normally push it taller — otherwise the "same
  // height per 30 min" promise breaks on any busy/verbose cell. Clamping is
  // only safe (and only wanted) in this mode; full-size-only should keep
  // growing to fit content.
  const clampCellHeightPx = standardisedScale
    ? TABLE_SETTINGS.ROW_HEIGHT_PX
    : undefined

  const { TABLE_MATRIX, TABLE_MAX_DAY_COLUMNS, TABLE_OVERFLOW_THRESHOLD } =
    useMemo(() => {
      if (precomputedMatrix) {
        const sumCols = Object.values(
          precomputedMatrix.TABLE_MAX_DAY_COLUMNS
        ).reduce((a, b) => a + b, 0)
        return {
          TABLE_MATRIX: precomputedMatrix.TABLE_MATRIX,
          TABLE_MAX_DAY_COLUMNS: precomputedMatrix.TABLE_MAX_DAY_COLUMNS,
          TABLE_OVERFLOW_THRESHOLD: sumCols > (isMobile ? 6 : 9)
        }
      }
      return generateTimetableMatrix(
        cloneModuleIndexMap(moduleIndexMap),
        isMobile ? 6 : 9
      )
    }, [moduleIndexMap, isMobile, precomputedMatrix])

  const [currentHoverKey, setCurrentHoverKey] = useState("")

  const handleIndexClick = (
    moduleKey: string,
    indexKey: string,
    indexPickerEnabled: boolean | undefined,
    previewCandidate: boolean
  ) => {
    if (!indexPickerEnabled) return

    if (previewCandidate) {
      indexPicker?.onIndexSelect(moduleKey, indexKey)
      return
    }

    indexPicker?.onActiveModuleChange(moduleKey)
  }

  const handleIndexMouseOver = (indexKey: string, isLecture: boolean) => {
    // Hovering on lectures will not highlight other indexes as they are common lectures
    if (isLecture && alwaysHighlightLectures) return
    setCurrentHoverKey(indexKey)
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className={cn(TABLE_OVERFLOW_THRESHOLD && "overflow-x-auto")}>
        <table
          className={cn(
            "w-full text-[0.6rem] lg:text-xs",
            TABLE_OVERFLOW_THRESHOLD ? "table-auto" : "table-fixed"
          )}>
          <TimetableTableThead
            days={Object.keys(TABLE_MAX_DAY_COLUMNS).length}
            maxDayColumns={TABLE_MAX_DAY_COLUMNS}
          />

          {/* TBODY */}
          <tbody>
            {Object.entries(TABLE_MATRIX).map(([matrixKey, rowData]) => {
              const tsIndex = parseInt(matrixKey)

              return (
                <tr key={matrixKey} style={rowHeightStyle}>
                  <TimeSlotItem startTime={STARS_TIMESLOTS[tsIndex].start} />

                  {rowData.map((dayColumn, dayIndex) => {
                    const rowDayIndex = dayIndex + 1
                    const MAX_COL_SPAN = TABLE_MAX_DAY_COLUMNS[rowDayIndex]
                    const emptyArrayLength = MAX_COL_SPAN - dayColumn.length

                    return (
                      <Fragment key={matrixKey + dayIndex}>
                        {dayColumn.map((index, offsetIdx) => {
                          const firstIndex = getFirstTsIndex(index)
                          const isLecture = getIndexType(index.type) === "LEC"

                          // Dim lectures if there are tutorials or labs hovered
                          const shouldDimlecture = isLecture
                            ? // Always highlight lectures if alwaysHighlightLectures is true
                              alwaysHighlightLectures
                              ? false
                              : true
                            : true

                          // Only render the first cell, the cells below will be empty due to rowspan
                          if (
                            firstIndex === tsIndex &&
                            rowDayIndex === index.day
                          ) {
                            const moduleKey = Object.keys(moduleIndexMap).find(
                              (x) =>
                                moduleIndexMap[x].some(
                                  (y) => y.key === index.key
                                )
                            ) as string // Guaranteed to be defined
                            const indexPickerEnabled = indexPicker?.enabled
                            const previewActive =
                              !!indexPickerEnabled &&
                              indexPicker.activeModuleKey === moduleKey &&
                              index.key === indexPicker.activeIndexKey
                            const previewCandidate =
                              !!indexPickerEnabled &&
                              indexPicker.activeModuleKey === moduleKey &&
                              index.key !== indexPicker.activeIndexKey
                            const pickerDimmed =
                              !!indexPickerEnabled &&
                              !!indexPicker.activeModuleKey &&
                              indexPicker.activeModuleKey !== moduleKey

                            return (
                              <TimetableTableCell
                                // Core
                                key={`${matrixKey}-${dayIndex}-${index.key}-${offsetIdx}`}
                                moduleKey={moduleKey}
                                index={index}
                                indexes={moduleIndexMap[moduleKey]}
                                // Styling
                                moduleKeyText={
                                  isLecture && showModuleKeyAsCommon
                                    ? "COMMON"
                                    : moduleKey
                                }
                                hideIndex={hideIndex}
                                fullCell={fullCell}
                                clampCellHeightPx={clampCellHeightPx}
                                dimmed={
                                  currentHoverKey !== "" &&
                                  currentHoverKey !== index.key &&
                                  shouldDimlecture
                                }
                                previewActive={previewActive}
                                previewCandidate={previewCandidate}
                                pickerDimmed={pickerDimmed}
                                onClick={() =>
                                  handleIndexClick(
                                    moduleKey,
                                    index.key,
                                    indexPickerEnabled,
                                    previewCandidate
                                  )
                                }
                                onMouseOver={() =>
                                  handleIndexMouseOver(index.key, isLecture)
                                }
                                onMouseOut={() => setCurrentHoverKey("")}
                              />
                            )
                          }
                        })}

                        {/* Generate empty cell based off the offset of max col span */}
                        {Array.from({ length: emptyArrayLength }, (_, i) => (
                          <td key={`empty-${i}`} className="min-w-10" />
                        ))}
                      </Fragment>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </TooltipProvider>
  )
}
