"use client"

import { useEffect, useState } from "react"

export interface AllModule {
  code: string
  title: string
  au: string
  searchKeys: string[]
  notAvailableToProgramme?: string
  isCurrentSemester?: boolean
  latestYear?: string
  latestSemester?: string
}

let modulesCache: AllModule[] | null = null
let fetchPromise: Promise<AllModule[]> | null = null

function fetchAllModules(): Promise<AllModule[]> {
  if (!fetchPromise) {
    fetchPromise = fetch("/data/api/modules.json")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch modules")
        return res.json()
      })
      .then((data: { modules: AllModule[] }) => {
        modulesCache = data.modules
        return data.modules
      })
      .catch(() => {
        fetchPromise = null
        return []
      })
  }
  return fetchPromise
}

export function useAllModules() {
  const [modules, setModules] = useState<AllModule[]>(() => modulesCache ?? [])
  const [isLoading, setIsLoading] = useState(!modulesCache)

  useEffect(() => {
    if (modulesCache) {
      setModules(modulesCache)
      setIsLoading(false)
      return
    }

    fetchAllModules().then((mods) => {
      setModules(mods)
      setIsLoading(false)
    })
  }, [])

  return { modules, isLoading }
}
