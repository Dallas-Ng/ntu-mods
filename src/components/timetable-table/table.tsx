"use client"

import { Fragment, useState } from "react"

import { TABLE_SETTINGS } from "@/config/table-settings"
import { STARS_TIMESLOTS } from "@/lib/constants"
import {
  generateTimetableMatrix,
  getFirstTsIndex
} from "@/lib/generate-timetable-matrix"
import { getIndexType } from "@/lib/get-index-type"
import { cn } from "@/lib/utils"
import { useSettings } from "@/hooks/use-settings"

import { TimetableTableCell } from "./cell"
import { TimetableTableThead } from "./thead"

const TimeSlotItem = ({ startTime }: { startTime: number }) => (
  <td className="relative">
    <span className="absolute left-0 top-[-8px] w-full bg-card px-1 text-center">
      {startTime}
    </span>

    <div className={TABLE_SETTINGS.TIMESLOT_CLASS} />
  </td>
)

interface Props {
  moduleIndexMap: TimetableWithIndex
  hideIndex?: boolean
  fullCell?: boolean
  showModuleKeyAsCommon?: boolean
  alwaysHighlightLectures?: boolean
}

export const TimetableTable = (props: Props) => {
  const {
    moduleIndexMap,
    hideIndex = false,
    fullCell = false,
    showModuleKeyAsCommon = false,
    alwaysHighlightLectures = false
  } = props
  const { isMobile } = useSettings()
  const { TABLE_MATRIX, TABLE_MAX_DAY_COLUMNS, TABLE_OVERFLOW_THRESHOLD } =
    generateTimetableMatrix(moduleIndexMap, isMobile ? 6 : 9)

  const [currentHoverKey, setCurrentHoverKey] = useState("")

  return (
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
              <tr key={matrixKey}>
                <TimeSlotItem startTime={STARS_TIMESLOTS[tsIndex].start} />

                {rowData.map((dayColumn, dayIndex) => {
                  const rowDayIndex = dayIndex + 1
                  const MAX_COL_SPAN = TABLE_MAX_DAY_COLUMNS[rowDayIndex]
                  const emptyArrayLength = MAX_COL_SPAN - dayColumn.length

                  return (
                    <Fragment key={matrixKey + dayIndex}>
                      {dayColumn.map((index) => {
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
                              moduleIndexMap[x].find((y) => y.key === index.key)
                          ) as string // Guaranteed to be defined

                          return (
                            <TimetableTableCell
                              // Core
                              key={index.key}
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
                              dimmed={
                                currentHoverKey !== "" &&
                                currentHoverKey !== index.key &&
                                shouldDimlecture
                              }
                              onMouseOver={() => {
                                // Hovering on lectures will not highlight other indexes as they are common lectures
                                if (isLecture && alwaysHighlightLectures) {
                                  // setCurrentHoverKey(index.key)
                                } else {
                                  setCurrentHoverKey(index.key)
                                }
                              }}
                              onMouseOut={() => setCurrentHoverKey("")}
                            />
                          )
                        }
                      })}

                      {/* Generate empty cell based off the offset of max col span */}
                      {Array.from({ length: emptyArrayLength }, (_, i) => (
                        <td key={`empty-${i}`} className="min-w-[40px]" />
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
  )
}

export const TimetableTableLoader = () => (
  <table className="table-fixed text-[0.6rem] opacity-30 lg:text-xs">
    <TimetableTableThead
      days={5}
      maxDayColumns={{ 1: 1, 2: 1, 3: 1, 4: 1, 5: 1 }} // default
    />

    <tbody>
      {STARS_TIMESLOTS.slice(3, 21).map((x, i) => (
        <tr key={i}>
          <TimeSlotItem startTime={x.start} />

          {Array.from({ length: 5 }, (_, i) => (
            <td key={i} />
          ))}
        </tr>
      ))}
    </tbody>
  </table>
)
