"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, ChevronUp } from "lucide-react"

import type { ApiExam } from "@/lib/server/get-module-exam-data"
import type { ApiModule } from "@/lib/server/get-module-metadata"
import { cn } from "@/lib/utils"

const MODULE_CODE_RE = /^[A-Z]{2,6}\d{4}[A-Z]?$/

interface Props {
  module: ApiModule
  exam?: ApiExam | null
  totalHours?: number
}

const TOP_FIELDS: Array<{ key: keyof ApiModule; label: string }> = [
  { key: "gradeType", label: "Grade Type" },
  { key: "prerequisite", label: "Prerequisite" }
]

const BOTTOM_FIELDS: Array<{ key: keyof ApiModule; label: string }> = [
  { key: "notAvailableToProgramme", label: "Not Available To Programme" },
  {
    key: "notAvailableToAllProgrammeWith",
    label: "Not Available To All Programme With"
  },
  {
    key: "notAvailableAsBdeueToProgramme",
    label: "Not Available As BDE/UE To Programme"
  },
  {
    key: "notAvailableAsCoreToProgramme",
    label: "Not Available As Core To Programme"
  },
  {
    key: "notAvailableAsPeToProgramme",
    label: "Not Available As PE To Programme"
  },
  { key: "mutuallyExclusiveWith", label: "Mutually Exclusive With" },
  { key: "notOfferedAsBde", label: "Not Offered As BDE" },
  { key: "notOfferedAsUe", label: "Not Offered As Unrestricted Elective" }
]

function hasValue(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (Array.isArray(value)) return value.length > 0
  return true
}

function renderValue(key: keyof ApiModule, value: unknown) {
  if (key === "prerequisite" && Array.isArray(value)) {
    const allCodes = (value as string[][]).flat()
    const unique = Array.from(new Set(allCodes))
    return unique.map((item, idx) => (
      <span key={item}>
        {MODULE_CODE_RE.test(item) ? (
          <Link
            href={`/mods/${item}`}
            className="text-blue-500 transition-colors hover:text-blue-600">
            {item}
          </Link>
        ) : (
          item
        )}
        {idx < unique.length - 1 && ", "}
      </span>
    ))
  }
  if (Array.isArray(value)) return value.join(", ")
  if (key === "notOfferedAsBde" || key === "notOfferedAsUe") return "Yes"
  return String(value)
}

const ModsInfoTable = ({ module, exam, totalHours }: Props) => {
  const [expanded, setExpanded] = useState(false)

  const extrasRows = module.extras ? Object.entries(module.extras) : []
  const bottomRowsWithContent = BOTTOM_FIELDS.filter(({ key }) =>
    hasValue(module[key])
  )
  const hasBottomContent =
    bottomRowsWithContent.length > 0 || extrasRows.length > 0

  return (
    <div className="space-y-3">
      {/* Top table: AU, Grade Type, Prerequisite, Exam */}
      <table className="bg-background w-full text-sm">
        <tbody>
          <tr className="border-b">
            <td className="w-[200px] p-2">AUs</td>
            <td className="p-2">{module.au} AUs</td>
          </tr>

          {TOP_FIELDS.map(({ key, label }) => {
            const value = module[key]
            const has = hasValue(value)
            return (
              <tr key={key} className="border-b">
                <td
                  className={cn(
                    "p-2 font-medium",
                    !has && "text-muted-foreground"
                  )}>
                  {label}
                </td>
                <td className="p-2">{has && renderValue(key, value)}</td>
              </tr>
            )
          })}

          <tr>
            <td
              className={cn(
                "p-2 font-medium",
                !exam && "text-muted-foreground"
              )}>
              Exam
            </td>
            <td className="p-2">
              {exam
                ? `${exam.date}, ${exam.start_time} - ${exam.end_time}`
                : ""}
            </td>
          </tr>
        </tbody>
      </table>

      {exam && (
        <p className="text-muted-foreground text-xs">
          The Exam information shown may be subject to changes. Students are to
          check the finalised exam timetable with exam seat information, which
          will be available at the &apos;Examination Seating Arrangement&apos;
          webpage, 2 weeks before start of examination.
        </p>
      )}

      {totalHours !== undefined && (
        <div className="text-muted-foreground text-sm">
          Total hours per week: {totalHours} hrs
        </div>
      )}

      {/* Bottom table: remaining fields with read more */}
      {hasBottomContent && (
        <div className="space-y-1">
          {expanded && (
            <table className="bg-background w-full text-sm">
              <tbody>
                {BOTTOM_FIELDS.map(({ key, label }) => {
                  const value = module[key]
                  const has = hasValue(value)
                  return (
                    <tr key={key} className="border-b">
                      <td
                        className={cn(
                          "w-[200px] p-2 font-medium",
                          !has && "text-muted-foreground"
                        )}>
                        {label}
                      </td>
                      <td className="p-2">{has && renderValue(key, value)}</td>
                    </tr>
                  )
                })}
                {extrasRows.map(([label, value]) => (
                  <tr key={label} className="border-b">
                    <td className="w-[200px] p-2">{label}</td>
                    <td className="p-2">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-sm transition-colors">
            {expanded ? (
              <ChevronUp className="size-3" />
            ) : (
              <ChevronDown className="size-3" />
            )}
            {expanded ? "Show less" : "Show more"}
          </button>
        </div>
      )}
    </div>
  )
}

export default ModsInfoTable
