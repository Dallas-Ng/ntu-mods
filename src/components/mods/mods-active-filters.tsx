"use client"

import { X } from "lucide-react"
import posthog from "posthog-js"

import { MODULE_CATEGORY, MODULE_FACULTY, TRUN_DAY_MAP } from "@/lib/constants"
import { TIME_OPTIONS } from "@/lib/generation-config"
import { usePathname } from "@/hooks/use-pathname"
import { pushSearchParams, useSearchParams } from "@/hooks/use-search-params"
import { Button } from "@/components/ui/button"

const FILTER_KEYS = [
  "searchTerm",
  "moduleType",
  "moduleFaculty",
  "moduleLevel",
  "currentOnly",
  "moduleDay",
  "moduleTimeStart",
  "moduleTimeEnd"
]

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
  moduleDay?: string
  moduleTimeStart?: string
  moduleTimeEnd?: string
}

export const ModsActiveFilters = ({
  searchTerm,
  moduleType,
  moduleLevel,
  moduleFaculty,
  currentOnly,
  moduleDay,
  moduleTimeStart,
  moduleTimeEnd
}: Props) => {
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
        (MODULE_CATEGORY as Record<string, string>)[moduleType] ?? moduleType
    })
  }

  if (moduleLevel !== "all") {
    activeFilters.push({ key: "moduleLevel", label: `Level ${moduleLevel}000` })
  }

  if (moduleFaculty !== "all") {
    activeFilters.push({
      key: "moduleFaculty",
      label: `${(MODULE_FACULTY as Record<string, string>)[moduleFaculty] ?? moduleFaculty} (${moduleFaculty})`
    })
  }
  if (currentOnly === "false") {
    activeFilters.push({ key: "currentOnly", label: "Incl. past semesters" })
  }

  if (moduleDay && moduleDay !== "all") {
    const days = moduleDay
      .split(",")
      .map(Number)
      .map((d) => TRUN_DAY_MAP[d as keyof typeof TRUN_DAY_MAP])
      .join(", ")
    activeFilters.push({ key: "moduleDay", label: `Days: ${days}` })
  }

  if (moduleTimeStart && moduleTimeStart !== "all") {
    const t = TIME_OPTIONS.find((o) => String(o.value) === moduleTimeStart)
    if (t)
      activeFilters.push({ key: "moduleTimeStart", label: `From ${t.label}` })
  }

  if (moduleTimeEnd && moduleTimeEnd !== "all") {
    const t = TIME_OPTIONS.find((o) => String(o.value) === moduleTimeEnd)
    if (t)
      activeFilters.push({ key: "moduleTimeEnd", label: `Until ${t.label}` })
  }

  if (activeFilters.length === 0) return null

  const clearFilter = (key: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete(key)
    pushSearchParams(pathname, params.toString())
    posthog.capture("mods_filter_cleared", { filter_type: key })
  }

  const clearAll = () => {
    const params = new URLSearchParams(searchParams.toString())
    FILTER_KEYS.forEach((k) => params.delete(k))
    pushSearchParams(pathname, params.toString())
    posthog.capture("mods_filter_cleared", { filter_type: "all" })
  }

  return (
    <div className="flex flex-wrap gap-2">
      {activeFilters.map(({ key, label }) => (
        <Button
          key={key}
          variant="secondary"
          size="xs"
          onClick={() => clearFilter(key)}>
          {label}
          <X />
        </Button>
      ))}
      <Button variant="ghost" size="xs" onClick={clearAll}>
        Clear all
      </Button>
    </div>
  )
}
