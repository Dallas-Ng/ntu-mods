"use client"

import { useMemo } from "react"

import type { AllModule } from "@/types/mods"
import { CODE_QUERY_RE } from "@/lib/filter-modules"
import { offeredIn } from "@/lib/module-semester"

import { useAllModules } from "./use-all-modules"
import { useDebounce } from "./use-debounce"
import { useSelectedSemester } from "./use-selected-semester"

const MAX_RESULTS = 50

function searchModules(
  modules: AllModule[],
  query: string,
  semester: string
): AllModule[] {
  const q = query.toLowerCase().trim()
  if (!q) return []

  const currentModules = modules.filter((m) => offeredIn(m, semester))
  const isCodeQuery = CODE_QUERY_RE.test(q)

  if (isCodeQuery) {
    const codeMatches = currentModules.filter((m) =>
      m.code.toLowerCase().includes(q)
    )
    const titleMatches = currentModules.filter(
      (m) =>
        !m.code.toLowerCase().includes(q) && m.title.toLowerCase().includes(q)
    )
    return [...codeMatches, ...titleMatches].slice(0, MAX_RESULTS)
  }

  return currentModules
    .filter(
      (m) =>
        m.title.toLowerCase().includes(q) || m.code.toLowerCase().includes(q)
    )
    .slice(0, MAX_RESULTS)
}

export const useModuleSearchApi = (
  query: string = "",
  debounceMs: number = 300
) => {
  const { modules, isLoading } = useAllModules()
  const debouncedQuery = useDebounce(query, debounceMs)
  const { key: semester } = useSelectedSemester()

  const results = useMemo(
    () => searchModules(modules, debouncedQuery, semester),
    [modules, debouncedQuery, semester]
  )

  return { results, isLoading, error: null }
}
