"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { X } from "lucide-react"

import { MODULE_CATEGORY, MODULE_FACULTY } from "@/lib/constants"

interface ActiveFilter {
  key: string
  label: string
}

interface Props {
  searchTerm: string
  moduleType: string
  moduleLevel: string
  moduleFaculty: string
  currentOnly: string
}

export const ModsActiveFilters = ({
  searchTerm,
  moduleType,
  moduleLevel,
  moduleFaculty,
  currentOnly
}: Props) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const activeFilters: ActiveFilter[] = []

  if (searchTerm) {
    activeFilters.push({ key: "searchTerm", label: `"${searchTerm}"` })
  }

  if (moduleType !== "all") {
    activeFilters.push({
      key: "moduleType",
      label:
        MODULE_CATEGORY[moduleType as keyof typeof MODULE_CATEGORY] ??
        moduleType
    })
  }

  if (moduleLevel !== "all") {
    activeFilters.push({ key: "moduleLevel", label: `Level ${moduleLevel}` })
  }

  if (moduleFaculty !== "all") {
    activeFilters.push({
      key: "moduleFaculty",
      label: `${MODULE_FACULTY[moduleFaculty as keyof typeof MODULE_FACULTY] ?? moduleFaculty} (${moduleFaculty})`
    })
  }
  if (currentOnly === "false") {
    activeFilters.push({ key: "currentOnly", label: "All semesters" })
  } else {
    activeFilters.push({ key: "currentOnly", label: "Current Semester" })
  }

  if (activeFilters.length === 0) return null

  const clearFilter = (key: string) => {
    const params = new URLSearchParams(searchParams)
    params.delete(key)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {activeFilters.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => clearFilter(key)}
          className="bg-muted text-muted-foreground hover:bg-accent hover:text-foreground flex items-center gap-1 rounded-full border px-3 py-0.5 text-xs transition-colors">
          {label}
          <X className="h-3 w-3" />
        </button>
      ))}
    </div>
  )
}
