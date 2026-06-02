"use client"

import { AlertTriangleIcon, CheckCircleIcon, XCircleIcon } from "lucide-react"

import type { Course, CourseType, Grade } from "@/types/fgo"
import { GRADE_POINT_MAP, gradeToPoint } from "@/lib/fgo-optimizer"
import { cn } from "@/lib/utils"

const COURSE_TYPES: CourseType[] = [
  "Core",
  "ICC",
  "MPE",
  "BDE",
  "FYP",
  "Internship",
  "Others"
]

const TYPE_BADGE: Record<CourseType, string> = {
  Core: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  ICC: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  MPE: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  BDE: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  FYP: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300",
  Internship: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  Others: "bg-muted text-muted-foreground"
}

interface Props {
  courses: Course[]
  onChange: (courses: Course[]) => void
  editable?: boolean
}

export default function FgoCourseTable({
  courses,
  onChange,
  editable = true
}: Props) {
  function updateCourse(index: number, patch: Partial<Course>) {
    const next = courses.map((c, i) => {
      if (i !== index) return c
      const updated = { ...c, ...patch }
      // Recompute gradePoint when grade changes
      if ("grade" in patch) {
        updated.gradePoint = gradeToPoint(updated.grade) ?? null
        updated.isFailed = updated.grade === "F"
      }
      return updated
    })
    onChange(next)
  }

  function removeCourse(index: number) {
    onChange(courses.filter((_, i) => i !== index))
  }

  if (courses.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">
        No courses extracted. Upload a degree audit or add courses manually.
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Code</th>
            <th className="px-3 py-2 text-left font-medium">Title</th>
            <th className="px-3 py-2 text-left font-medium">AU</th>
            <th className="px-3 py-2 text-left font-medium">Grade</th>
            <th className="px-3 py-2 text-left font-medium">Type</th>
            <th className="px-3 py-2 text-center font-medium">FGO?</th>
            <th className="px-3 py-2 text-center font-medium">Status</th>
            {editable && <th className="px-3 py-2" />}
          </tr>
        </thead>
        <tbody className="divide-y">
          {courses.map((course, i) => (
            <tr
              key={`${course.courseCode}-${i}`}
              className={cn(
                "transition-colors",
                course.isFailed && "bg-red-50 dark:bg-red-950/20",
                course.isFgoApplied && "bg-muted/30 opacity-60"
              )}>
              <td className="px-3 py-2 font-mono text-xs">
                {course.courseCode}
              </td>
              <td className="max-w-48 px-3 py-2">
                <span className="line-clamp-2 text-xs">
                  {course.courseTitle}
                </span>
              </td>
              <td className="px-3 py-2 text-xs">{course.au}</td>
              <td className="px-3 py-2">
                {editable ? (
                  <select
                    className="rounded border px-1 py-0.5 text-xs"
                    value={course.grade}
                    onChange={(e) =>
                      updateCourse(i, { grade: e.target.value as Grade })
                    }>
                    {Object.keys(GRADE_POINT_MAP).map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                    {["S", "U", "EX", "IP", "W"].map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="font-mono text-xs">{course.grade}</span>
                )}
              </td>
              <td className="px-3 py-2">
                {editable ? (
                  <select
                    className="rounded border px-1 py-0.5 text-xs"
                    value={course.courseType}
                    onChange={(e) =>
                      updateCourse(i, {
                        courseType: e.target.value as CourseType
                      })
                    }>
                    {COURSE_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-xs font-medium",
                      TYPE_BADGE[course.courseType]
                    )}>
                    {course.courseType}
                  </span>
                )}
              </td>
              <td className="px-3 py-2 text-center">
                {course.isFgoApplied ? (
                  <span className="text-muted-foreground text-xs">Applied</span>
                ) : course.eligibleForFgo ? (
                  <CheckCircleIcon className="mx-auto size-4 text-green-500" />
                ) : (
                  <XCircleIcon className="text-muted-foreground mx-auto size-4" />
                )}
              </td>
              <td className="px-3 py-2 text-center">
                {course.isFailed ? (
                  <AlertTriangleIcon className="mx-auto size-4 text-red-500" />
                ) : course.isFgoApplied ? (
                  <span className="text-muted-foreground text-xs">
                    FGO&apos;d
                  </span>
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </td>
              {editable && (
                <td className="px-3 py-2">
                  <button
                    onClick={() => removeCourse(i)}
                    className="text-muted-foreground hover:text-destructive text-xs transition-colors">
                    ✕
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
