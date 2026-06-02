"use client"

import { useState } from "react"
import { AlertTriangleIcon, CheckIcon, PencilIcon } from "lucide-react"

import type { ExtractedAudit } from "@/types/fgo"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import FgoCourseTable from "./fgo-course-table"

interface Props {
  audit: ExtractedAudit
  onConfirm: (audit: ExtractedAudit) => void
  onReset: () => void
}

export default function FgoDataReview({ audit, onConfirm, onReset }: Props) {
  const [data, setData] = useState<ExtractedAudit>(audit)
  const [editing, setEditing] = useState(false)

  function updateStudentField(
    field: keyof ExtractedAudit["studentInfo"],
    value: string
  ) {
    const numFields = new Set<keyof ExtractedAudit["studentInfo"]>([
      "currentCgpa",
      "totalGradePoints",
      "totalCgpaAu"
    ])
    setData((d) => ({
      ...d,
      studentInfo: {
        ...d.studentInfo,
        [field]: numFields.has(field)
          ? value === ""
            ? null
            : parseFloat(value)
          : value || null
      }
    }))
  }

  function updateFgoField(
    field: keyof ExtractedAudit["fgoQuota"],
    value: string
  ) {
    setData((d) => ({
      ...d,
      fgoQuota: {
        ...d.fgoQuota,
        [field]: value === "" ? null : parseFloat(value)
      }
    }))
  }

  function updateGradField(
    field: keyof ExtractedAudit["graduationConstraints"],
    value: string
  ) {
    setData((d) => ({
      ...d,
      graduationConstraints: {
        ...d.graduationConstraints,
        [field]: value === "" ? null : parseFloat(value)
      }
    }))
  }

  const { studentInfo: si, fgoQuota: fq, graduationConstraints: gc } = data
  const hasWarnings = data.extractionWarnings.length > 0

  return (
    <div className="flex flex-col gap-6">
      {hasWarnings && (
        <div className="flex flex-col gap-2 rounded-lg border border-yellow-300 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950/30">
          <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
            <AlertTriangleIcon className="size-4" />
            <span className="text-sm font-medium">Extraction warnings</span>
          </div>
          {data.extractionWarnings.map((w, i) => (
            <p key={i} className="text-xs text-yellow-700 dark:text-yellow-400">
              {w}
            </p>
          ))}
          <p className="text-xs text-yellow-700 dark:text-yellow-400">
            Review and correct any missing fields before running the analysis.
          </p>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Extracted Data</h3>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setEditing((e) => !e)}
          className="gap-2">
          {editing ? (
            <>
              <CheckIcon className="size-3.5" />
              Done editing
            </>
          ) : (
            <>
              <PencilIcon className="size-3.5" />
              Edit
            </>
          )}
        </Button>
      </div>

      {/* Student Info */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {(
          [
            ["name", "Name", "text"],
            ["programme", "Programme", "text"],
            ["studyYear", "Study Year", "text"],
            ["currentCgpa", "Current CGPA", "number"],
            ["totalGradePoints", "Total Grade Points", "number"],
            ["totalCgpaAu", "Total CGPA AU", "number"]
          ] as const
        ).map(([field, label, type]) => (
          <div key={field} className="flex flex-col gap-1">
            <Label className="text-xs">{label}</Label>
            {editing ? (
              <Input
                type={type}
                value={
                  si[field as keyof typeof si] !== null &&
                  si[field as keyof typeof si] !== undefined
                    ? String(si[field as keyof typeof si])
                    : ""
                }
                onChange={(e) =>
                  updateStudentField(
                    field as keyof ExtractedAudit["studentInfo"],
                    e.target.value
                  )
                }
                className="h-7 text-xs"
                step={type === "number" ? "0.01" : undefined}
              />
            ) : (
              <span className="text-muted-foreground text-xs">
                {si[field as keyof typeof si] ?? (
                  <span className="text-yellow-600 dark:text-yellow-400">
                    unknown
                  </span>
                )}
              </span>
            )}
          </div>
        ))}
      </section>

      {/* FGO Quota */}
      <section>
        <h4 className="mb-3 text-sm font-medium">FGO Quota</h4>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {(
            [
              ["total", "Total Quota (AU)"],
              ["used", "Used (AU)"],
              ["remaining", "Remaining (AU)"],
              ["coreMpeIccCap", "Core/ICC/MPE Cap (AU)"],
              ["coreMpeIccUsed", "Core/ICC/MPE Used (AU)"],
              ["bdeUsed", "BDE Used (AU)"]
            ] as const
          ).map(([field, label]) => (
            <div key={field} className="flex flex-col gap-1">
              <Label className="text-xs">{label}</Label>
              {editing ? (
                <Input
                  type="number"
                  value={
                    fq[field] !== null && fq[field] !== undefined
                      ? String(fq[field])
                      : ""
                  }
                  onChange={(e) => updateFgoField(field, e.target.value)}
                  className="h-7 text-xs"
                />
              ) : (
                <span className="text-muted-foreground text-xs">
                  {fq[field] !== null && fq[field] !== undefined ? (
                    fq[field]
                  ) : (
                    <span className="text-yellow-600 dark:text-yellow-400">
                      unknown
                    </span>
                  )}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Graduation Constraints */}
      <section>
        <h4 className="mb-3 text-sm font-medium">Graduation Requirements</h4>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(
            [
              ["minLetterGradedAu", "Min Letter-graded AU"],
              ["currentLetterGradedAu", "Current Letter-graded AU"],
              ["minLetterGradedCoreMpeAu", "Min Core/MPE AU"],
              ["currentLetterGradedCoreMpeAu", "Current Core/MPE AU"]
            ] as const
          ).map(([field, label]) => (
            <div key={field} className="flex flex-col gap-1">
              <Label className="text-xs">{label}</Label>
              {editing ? (
                <Input
                  type="number"
                  value={
                    gc[field] !== null && gc[field] !== undefined
                      ? String(gc[field])
                      : ""
                  }
                  onChange={(e) => updateGradField(field, e.target.value)}
                  className="h-7 text-xs"
                />
              ) : (
                <span className="text-muted-foreground text-xs">
                  {gc[field] !== null && gc[field] !== undefined ? (
                    gc[field]
                  ) : (
                    <span className="text-yellow-600 dark:text-yellow-400">
                      unknown
                    </span>
                  )}
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Courses */}
      <section>
        <h4 className="mb-3 text-sm font-medium">
          Courses ({data.courses.length})
        </h4>
        <FgoCourseTable
          courses={data.courses}
          onChange={(courses) => setData((d) => ({ ...d, courses }))}
          editable={editing}
        />
      </section>

      <div className="flex gap-3 pt-2">
        <Button onClick={() => onConfirm(data)} className="flex-1">
          Analyse FGO Options
        </Button>
        <Button variant="outline" onClick={onReset}>
          Start Over
        </Button>
      </div>
    </div>
  )
}
