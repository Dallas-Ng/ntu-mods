"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { X } from "lucide-react"
import posthog from "posthog-js"

import { MODULE_CATEGORY, MODULE_FACULTY } from "@/lib/constants"
import { Button } from "@/components/ui/button"

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
        (MODULE_CATEGORY as Record<string, string>)[moduleType] ?? moduleType
    })
  }

  if (moduleLevel !== "all") {
    activeFilters.push({ key: "moduleLevel", label: `Level ${moduleLevel}` })
  }

  if (moduleFaculty !== "all") {
    activeFilters.push({
      key: "moduleFaculty",
      label: `${(MODULE_FACULTY as Record<string, string>)[moduleFaculty] ?? moduleFaculty} (${moduleFaculty})`
    })
  }
  if (currentOnly === "false") {
    activeFilters.push({ key: "currentOnly", label: "All Semesters" })
  }

  if (activeFilters.length === 0) return null

  const clearFilter = (key: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete(key)
    router.push(`${pathname}?${params.toString()}`, { scroll: false })
    posthog.capture("mods_filter_cleared", { filter_type: key })
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
    </div>
  )
}
