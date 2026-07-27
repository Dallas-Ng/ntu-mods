"use client"

import { Fragment, useEffect, useState } from "react"
import { Check, ChevronDown, ChevronUp, Trash2 } from "lucide-react"
import posthog from "posthog-js"

import { DAY_MAP } from "@/lib/constants"
import { getIndexType } from "@/lib/get-index-type"
import { getIndexTypeStyle } from "@/lib/get-index-type-style"
import { latestSemester, latestYear } from "@/lib/semesters"
import { cn } from "@/lib/utils"
import { useSeasonIndexes } from "@/hooks/use-season-indexes"
import { useTimetable } from "@/hooks/use-timetable"

const MONTH_SHORT: Record<string, string> = {
  January: "Jan",
  February: "Feb",
  March: "Mar",
  April: "Apr",
  May: "May",
  June: "Jun",
  July: "Jul",
  August: "Aug",
  September: "Sep",
  October: "Oct",
  November: "Nov",
  December: "Dec"
}

function shortDate(dateStr: string): string {
  // "23 November 2026" → "23 Nov"
  const [day, month] = dateStr.split(" ")
  return `${day} ${MONTH_SHORT[month] ?? month}`
}

interface Props {
  moduleKey: string
  title?: string
  au?: string
  examDate?: string
}

const TimetableModuleCard = ({ moduleKey, title, au, examDate }: Props) => {
  const { timetable, updateItemIndex, removeItemFromTimetable } = useTimetable()
  const indexKey = timetable[moduleKey]
  const { indexes: seasonIndexes } = useSeasonIndexes(
    latestYear,
    latestSemester
  )
  const [open, setOpen] = useState(false)

  const moduleIndexes = seasonIndexes[moduleKey] ?? {}

  // Unique session types across all indexes
  const sessionTypes = [
    ...new Set(
      Object.values(moduleIndexes)
        .flat()
        .map((s) => getIndexType(s.type))
    )
  ]

  // Check if LEC is common across all indexes
  const randomLecture =
    Object.values(moduleIndexes)
      .find((slots) => slots.some((s) => getIndexType(s.type) === "LEC"))
      ?.filter((s) => getIndexType(s.type) === "LEC") ?? []

  const allLectures = Object.values(moduleIndexes)
    .flat()
    .filter((s) => getIndexType(s.type) === "LEC")

  const hasCommonLecture =
    allLectures.length > 0 && randomLecture.length > 0
      ? allLectures.every((item) =>
          randomLecture.some((x) => x.day === item.day && x.time === item.time)
        )
      : false

  const handleSelect = (newIndexKey: string) => {
    updateItemIndex(moduleKey, newIndexKey)
    posthog.capture("timetable_index_changed", {
      module_code: moduleKey,
      index_key: newIndexKey,
      source: "left_panel_card"
    })
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    removeItemFromTimetable(moduleKey)
    posthog.capture("module_removed", {
      module_code: moduleKey,
      source: "timetable_sidebar"
    })
  }

  return (
    <div className="border-b last:border-b-0">
      {/* Card header — click to toggle index picker */}
      <div
        className="hover:bg-accent/50 cursor-pointer px-3 py-2 transition-colors"
        onClick={() => setOpen((v) => !v)}>
        {/* Row 1: code + index + chevron + trash */}
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <span>{moduleKey}</span>
            <span className="text-muted-foreground font-normal">
              {indexKey}
            </span>
            {open ? (
              <ChevronUp className="text-muted-foreground size-3.5" />
            ) : (
              <ChevronDown className="text-muted-foreground size-3.5" />
            )}
          </div>
          <button
            onClick={handleRemove}
            className="text-muted-foreground hover:text-destructive shrink-0 p-1 transition-colors">
            <Trash2 className="size-3.5" />
          </button>
        </div>

        {/* Row 2: title + AU */}
        {title && (
          <div className="text-muted-foreground flex justify-between text-xs">
            <span className="truncate pr-2">{title}</span>
            {au && <span className="shrink-0 font-medium">{au} AU</span>}
          </div>
        )}

        {/* Row 3: exam + session types */}
        <div className="mt-0.5 flex items-center gap-2 text-xs">
          {examDate ? (
            <span className="font-medium text-amber-600 dark:text-amber-400">
              ⚠ {shortDate(examDate)}
            </span>
          ) : (
            <span className="text-muted-foreground/60">no exam</span>
          )}
          {sessionTypes.length > 0 && (
            <span className="text-muted-foreground ml-auto">
              {sessionTypes.join(" · ")}
            </span>
          )}
        </div>
      </div>

      {/* Inline index picker */}
      {open && (
        <div className="bg-muted/30 border-t">
          {/* Common lecture */}
          {hasCommonLecture && randomLecture.length > 0 && (
            <div className="border-b px-3 py-2">
              <p className="text-muted-foreground mb-1 text-xs">
                Same in every index
              </p>
              {randomLecture.map((slot, i) => (
                <div key={i} className="text-xs">
                  <span className="font-medium">
                    LEC {(DAY_MAP as Record<number, string>)[slot.day]}{" "}
                    {slot.time}
                  </span>
                  <span className="text-muted-foreground"> · {slot.venue}</span>
                </div>
              ))}
            </div>
          )}

          {/* Index list */}
          {Object.keys(moduleIndexes).length > 0 && (
            <div className="py-1">
              {hasCommonLecture && (
                <p className="text-muted-foreground px-3 pb-1 text-xs">
                  Pick one
                </p>
              )}
              {Object.entries(moduleIndexes).map(([idxKey, slots]) => {
                const active = indexKey === idxKey
                const diffSlots = hasCommonLecture
                  ? slots.filter((s) => getIndexType(s.type) !== "LEC")
                  : slots

                return (
                  <Fragment key={idxKey}>
                    <button
                      onClick={() => handleSelect(idxKey)}
                      className={cn(
                        "flex w-full items-start gap-2 px-3 py-1.5 text-xs transition-colors",
                        active
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-accent text-foreground"
                      )}>
                      <Check
                        className={cn(
                          "mt-0.5 size-3 shrink-0",
                          active ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <div className="min-w-0 text-left">
                        <span className="font-medium">{idxKey}</span>
                        {diffSlots.map((slot, i) => {
                          const isOnline = !slot.day || slot.day === 0
                          return (
                            <div
                              key={i}
                              className="text-muted-foreground leading-snug">
                              {getIndexType(slot.type)}{" "}
                              {isOnline
                                ? "Online"
                                : (DAY_MAP as Record<number, string>)[
                                    slot.day
                                  ]}{" "}
                              {slot.time}
                              {slot.venue && ` · ${slot.venue}`}
                            </div>
                          )
                        })}
                      </div>
                    </button>
                  </Fragment>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default TimetableModuleCard
