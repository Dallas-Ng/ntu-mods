"use client"

import { useAcademicContextHook } from "@/hooks/use-academic-context"
import { cn } from "@/lib/utils"

interface SemesterEntry {
  year: string
  semester: string
  label: string
}

// Hardcoded to the available metadata files in src/data/api/metadata/
const AVAILABLE_SEMESTERS: SemesterEntry[] = [
  { year: "2025", semester: "2", label: "AY2025/2026 Semester 2" },
  { year: "2025", semester: "1", label: "AY2025/2026 Semester 1" },
  { year: "2024", semester: "2", label: "AY2024/2025 Semester 2" },
  { year: "2024", semester: "1", label: "AY2024/2025 Semester 1" },
  { year: "2024", semester: "S", label: "AY2024/2025 Special Term" },
  { year: "2023", semester: "2", label: "AY2023/2024 Semester 2" },
  { year: "2023", semester: "1", label: "AY2023/2024 Semester 1" },
  { year: "2023", semester: "S", label: "AY2023/2024 Special Term" }
]

const ModsSemesterNav = () => {
  const { year, semester, setAcademicContext } = useAcademicContextHook()

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-muted-foreground">
        Browse by Semester
      </p>
      <div className="flex flex-wrap gap-2">
        {AVAILABLE_SEMESTERS.map((s) => {
          const isActive = s.year === year && s.semester === semester
          return (
            <button
              key={`${s.year}-${s.semester}`}
              onClick={() => setAcademicContext(s.year, s.semester)}
              className={cn(
                "rounded-md border px-3 py-1 text-sm transition-colors hover:bg-accent",
                isActive && "border-ring bg-accent font-medium"
              )}>
              {s.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default ModsSemesterNav
