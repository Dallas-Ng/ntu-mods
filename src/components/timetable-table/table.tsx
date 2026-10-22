"use client"

import {
  Fragment,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from "react"
import { useIndexHover } from "@/state/index-hover.state"
import { ChevronRight } from "lucide-react"

import { TABLE_SETTINGS } from "@/config/table-settings"
import { commonLectureId } from "@/lib/common-lectures"
import { STARS_TIMESLOTS } from "@/lib/module-constants"
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
  /** Ids from `findCommonLectures`: these lectures are labelled and hover as one. */
  commonLectures?: Set<string>
  /** Called when the grid becomes wider than its box (it then scrolls sideways). */
  onOverflowChange?: (overflow: boolean) => void
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
    commonLectures,
    onOverflowChange,
    precomputedMatrix,
    indexPicker
  } = props
  const { isMobile, settings } = useSettings()
  const { standardisedScale } = settings
  // Baseline (always on, not a setting): a row with nothing else in it has
  // no reason to be taller than a single text line, so a block spanning
  // several such rows via rowSpan ends up shorter than its real duration —
  // its own coloured area doesn't reach the timeslot it's meant to end at.
  //
  // `height` (not `minHeight`) on purpose: browsers don't respect
  // min-height in the table row-height-distribution algorithm at all, but
  // `height` acts as exactly the minimum we want AND still lets a row grow
  // for content that genuinely needs more (CSS 2.1 §17.5.3). Standardised
  // scale then additionally clamps each cell (see `clamp` below) so
  // content can no longer grow the row past this value.
  // Standardised scale: every 30 min slot gets one height, taken from the
  // cell that needs the most room per slot (measured below), so no cell is
  // cut off. Otherwise slots keep the baseline height.
  const tableRef = useRef<HTMLTableElement>(null)
  const [fitPx, setFitPx] = useState<number>(TABLE_SETTINGS.ROW_HEIGHT_PX)
  const rowPx = standardisedScale ? fitPx : TABLE_SETTINGS.ROW_HEIGHT_PX
  const rowHeightStyle = { height: rowPx }

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

  useLayoutEffect(() => {
    const table = tableRef.current
    if (!standardisedScale || !table) return
    const measure = () => {
      let need: number = TABLE_SETTINGS.ROW_HEIGHT_PX
      table.querySelectorAll<HTMLElement>("[data-cell-fit]").forEach((el) => {
        const box = el.parentElement
        if (!box) return
        const cs = getComputedStyle(box)
        const pad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom)
        const slots = Number(el.dataset.duration) || 1
        need = Math.max(need, (el.offsetHeight + pad) / slots)
      })
      setFitPx((prev) => {
        const next = Math.ceil(need)
        return prev === next ? prev : next
      })
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(table)
    return () => ro.disconnect()
  }, [standardisedScale, TABLE_MATRIX, isMobile])

  const hoveredPicker = useIndexHover((s) => s.hovered)
  const [currentHoverKey, setCurrentHoverKey] = useState("")
  // Set while a common lecture is hovered: every index of that module lights up.
  const [hoverCommonModule, setHoverCommonModule] = useState("")

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

  // Edge fades say there is more table to scroll to, like the map's chip row.
  const scroller = useRef<HTMLDivElement>(null)
  const [more, setMore] = useState({ left: false, right: false })
  const measure = useCallback(() => {
    const el = scroller.current
    if (!el) return
    const left = el.scrollLeft > 2
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 2
    setMore((m) => (m.left === left && m.right === right ? m : { left, right }))
    onOverflowChange?.(el.scrollWidth > el.clientWidth + 2)
  }, [onOverflowChange])
  useEffect(() => {
    const el = scroller.current
    if (!el) return
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    if (el.firstElementChild) ro.observe(el.firstElementChild)
    return () => {
      ro.disconnect()
      onOverflowChange?.(false)
    }
  }, [measure, onOverflowChange, TABLE_MATRIX, TABLE_OVERFLOW_THRESHOLD])

  const handleIndexMouseOver = (
    indexKey: string,
    isLecture: boolean,
    commonModule?: string
  ) => {
    if (commonModule) {
      setHoverCommonModule(commonModule)
      return
    }
    // Hovering on lectures will not highlight other indexes as they are common lectures
    if (isLecture && alwaysHighlightLectures) return
    setCurrentHoverKey(indexKey)
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="relative">
        <div
          ref={scroller}
          onScroll={measure}
          className={cn(TABLE_OVERFLOW_THRESHOLD && "overflow-x-auto")}>
          <table
            ref={tableRef}
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
                // A row with nothing scheduled on any day is just spacing —
                // forcing it to the uniform row height wastes vertical space
                // for no reason, so let it keep its natural (small) height.
                const rowHasContent = rowData.some(
                  (dayColumn) => dayColumn.length > 0
                )

                return (
                  <tr
                    key={matrixKey}
                    style={rowHasContent ? rowHeightStyle : undefined}>
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
                              const moduleKey = Object.keys(
                                moduleIndexMap
                              ).find((x) =>
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
                              const common =
                                isLecture &&
                                !!commonLectures?.has(
                                  commonLectureId(moduleKey, index)
                                )

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
                                  rowHeightPx={rowPx}
                                  clamp={standardisedScale}
                                  common={common}
                                  dimmed={
                                    hoverCommonModule !== ""
                                      ? hoverCommonModule !== moduleKey
                                      : currentHoverKey !== "" &&
                                        currentHoverKey !== index.key &&
                                        shouldDimlecture
                                  }
                                  previewActive={previewActive}
                                  previewCandidate={previewCandidate}
                                  pickerDimmed={
                                    pickerDimmed ||
                                    (!!hoveredPicker &&
                                      hoveredPicker.moduleKey !== moduleKey)
                                  }
                                  hoverState={
                                    hoveredPicker?.moduleKey !== moduleKey
                                      ? undefined
                                      : index.key === hoveredPicker.indexKey &&
                                          index.key !== hoveredPicker.currentKey
                                        ? "preview"
                                        : "current"
                                  }
                                  onClick={() =>
                                    handleIndexClick(
                                      moduleKey,
                                      index.key,
                                      indexPickerEnabled,
                                      previewCandidate
                                    )
                                  }
                                  onMouseOver={() => {
                                    // While picking an index for one module, the
                                    // other modules are faded out: hovering them
                                    // must not dim anything.
                                    if (pickerDimmed) return
                                    handleIndexMouseOver(
                                      index.key,
                                      isLecture,
                                      common ? moduleKey : undefined
                                    )
                                  }}
                                  onMouseOut={() => {
                                    setCurrentHoverKey("")
                                    setHoverCommonModule("")
                                  }}
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
        <div
          aria-hidden
          style={{
            background:
              "linear-gradient(to right, hsl(var(--background)), transparent)"
          }}
          className={cn(
            "pointer-events-none absolute inset-y-0 left-0 z-10 w-12 transition-opacity duration-200 motion-reduce:transition-none",
            more.left ? "opacity-100" : "opacity-0"
          )}
        />
        <div
          aria-hidden
          style={{
            background:
              "linear-gradient(to left, hsl(var(--background)) 15%, transparent)"
          }}
          className={cn(
            "pointer-events-none absolute inset-y-0 right-0 z-10 flex w-14 items-center justify-end pr-1 transition-opacity duration-200 motion-reduce:transition-none",
            more.right ? "opacity-100" : "opacity-0"
          )}>
          <ChevronRight className="text-muted-foreground size-5" />
        </div>
      </div>
    </TooltipProvider>
  )
}
