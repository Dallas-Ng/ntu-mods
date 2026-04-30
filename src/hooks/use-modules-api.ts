import { useCallback, useEffect, useState } from "react"

import { useLatestSemester } from "./use-latest-semester"

interface Module {
  code: string
  title: string
  au: string
  searchKeys?: string[]
  notAvailableToProgramme?: string
}

interface ModulesResponse {
  modules: Module[]
  total: number
  hasMore: boolean
  page: number
}

/**
 * Hook for fetching paginated modules
 * Automatically uses the current year/semester from academic context
 */
export const useModulesApi = () => {
  const { year, semester } = useLatestSemester()
  const [modules, setModules] = useState<Module[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [skip, setSkip] = useState(0)

  const fetchModules = useCallback(
    async (pageSkip: number = 0) => {
      try {
        setIsLoading(true)
        setError(null)

        const params = new URLSearchParams({
          year,
          semester,
          skip: pageSkip.toString(),
          limit: "100"
        })

        const response = await fetch(`/api/data/modules?${params}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch modules: ${response.status}`)
        }

        const data = (await response.json()) as ModulesResponse

        if (pageSkip === 0) {
          // First page - replace
          setModules(data.modules)
          setSkip(100)
        } else {
          // Subsequent pages - append
          setModules((prev) => [...prev, ...data.modules])
          setSkip(pageSkip + (data.modules?.length || 0))
        }

        setTotal(data.total)
        setHasMore(data.hasMore)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setIsLoading(false)
      }
    },
    [year, semester]
  )

  // Fetch first page when year/semester changes
  useEffect(() => {
    setModules([])
    setSkip(0)
    fetchModules(0)
  }, [year, semester, fetchModules])

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchModules(skip)
    }
  }, [skip, isLoading, hasMore, fetchModules])

  return {
    modules,
    total,
    hasMore,
    isLoading,
    error,
    loadMore
  }
}
