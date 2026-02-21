"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"

import { getModuleCategories } from "@/lib/get-module-category"
import { getModuleFaculty } from "@/lib/get-module-faculty"
import { useAcademicContextHook } from "@/hooks/use-academic-context"
import Header from "@/components/header"
import ModsEmptyCard from "@/components/mods/mods-empty-card"
import { SearchModuleFaculty } from "@/components/mods/mods-faculty-select"
import {
  ModsLevelSelect,
  SearchModuleLevel
} from "@/components/mods/mods-module-level-select"
import {
  ModsModuleTypeSelect,
  SearchModuleType
} from "@/components/mods/mods-module-type-select"
import ModsSearchInput from "@/components/mods/mods-search-input"
import { Semester } from "@/components/mods/mods-semester-select"
import {
  ModuleCardDetail,
  ModuleCardDetailLoading
} from "@/components/module-card"

interface Props {
  searchParams: {
    searchTerm?: string
    semester?: Semester
    moduleType?: SearchModuleType
    moduleFaculty?: SearchModuleFaculty
    moduleLevel?: SearchModuleLevel
  }
}

interface ModuleData {
  code: string
  title: string
  au: string
  searchKeys?: string[]
  notAvailableToProgramme?: string
}

const ModsPage = ({ searchParams }: Props) => {
  const {
    searchTerm = "",
    semester = "s1",
    moduleType = "all",
    moduleFaculty = "all",
    moduleLevel = "all"
  } = searchParams

  const { year, semester: contextSemester } = useAcademicContextHook()
  const [mounted, setMounted] = useState(false)
  const [modules, setModules] = useState<ModuleData[]>([])
  const [allModulesLoaded, setAllModulesLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const loaderRef = useRef<HTMLDivElement>(null)

  const loadModules = useCallback(
    async (skip: number = 0) => {
      try {
        if (skip === 0) setLoading(true)
        else setIsLoadingMore(true)

        const params = new URLSearchParams({
          year: year,
          semester: contextSemester,
          skip: skip.toString(),
          limit: "100"
        })

        const response = await fetch(`/api/data/modules?${params}`)
        if (!response.ok) throw new Error("Failed to load modules")

        const data = await response.json()

        if (skip === 0) {
          setModules(data.modules)
        } else {
          setModules((prev) => [...prev, ...data.modules])
        }

        setHasMore(data.hasMore)
        setAllModulesLoaded(!data.hasMore)
      } catch (error) {
        console.error("Error loading modules:", error)
        setAllModulesLoaded(true)
      } finally {
        setLoading(false)
        setIsLoadingMore(false)
      }
    },
    [year, contextSemester]
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  // Load initial modules when year/semester changes
  useEffect(() => {
    setModules([])
    setAllModulesLoaded(false)
    loadModules(0)
  }, [year, contextSemester, loadModules])

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      if (
        entries[0].isIntersecting &&
        !loading &&
        !isLoadingMore &&
        hasMore &&
        !allModulesLoaded
      ) {
        loadModules(modules.length)
      }
    })

    if (loaderRef.current) {
      observer.observe(loaderRef.current)
    }

    return () => {
      if (loaderRef.current) {
        observer.unobserve(loaderRef.current)
      }
    }
  }, [
    modules.length,
    loading,
    isLoadingMore,
    hasMore,
    allModulesLoaded,
    loadModules
  ])

  // Convert modules array for filtering
  let filteredModules: [string, ModuleData][] = modules.map((m) => [m.code, m])
  let filteredModsExcludingLevel: [string, ModuleData][] = []

  /**
   * Filter by search term
   */
  if (searchTerm.length === 2) {
    // Assume its a module code prefix
    filteredModules = filteredModules.filter(([moduleKey, _]) =>
      moduleKey.toLowerCase().startsWith(searchTerm.toLowerCase())
    )
  } else if (searchTerm.length > 0) {
    // Filter by module name or title
    filteredModules = filteredModules.filter(([moduleKey, moduleData]) => {
      return (
        moduleKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
        moduleData.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })
  }

  // Filter by module type
  if (moduleType !== "all") {
    filteredModules = filteredModules.filter(([_, moduleData]) =>
      getModuleCategories(moduleData.searchKeys || []).includes(
        moduleType as ModuleType
      )
    )
  }

  // Filter by module faculty
  if (moduleFaculty !== "all") {
    filteredModules = filteredModules.filter(
      ([_, moduleData]) =>
        getModuleFaculty(moduleData.code, moduleData.searchKeys || []) ===
        moduleFaculty
    )
  }

  // Used to persist module level select
  filteredModsExcludingLevel = filteredModules

  if (moduleLevel !== "all") {
    filteredModules = filteredModules.filter(
      ([moduleKey, _]) => moduleKey.slice(2, 3) === moduleLevel
    )
  }

  return (
    <div className="relative space-y-3">
      <Header
        title="NTU Modules"
        subtitle={
          mounted
            ? `AY${year}/${parseInt(year) + 1} Semester ${contextSemester}`
            : "\u00A0"
        }
      />

      <div className="flex w-full flex-col gap-2 lg:flex-row">
        <ModsSearchInput paramsValue={searchTerm} />
        {/* <ModsFacultySelect paramsValue={moduleFaculty} /> */}

        <div className="flex gap-2">
          <ModsModuleTypeSelect paramsValue={moduleType} />
        </div>

        <div className="flex gap-2">
          {/* <ModsSemesterSelect paramsValue={semester} /> */}

          <ModsLevelSelect
            searchTerm={searchTerm}
            paramValue={moduleLevel}
            modules={
              filteredModsExcludingLevel as unknown as [string, Module][]
            }
            filterModsLength={filteredModules.length}
          />
        </div>
      </div>

      <hr className="py-2" />

      {allModulesLoaded && filteredModules.length === 0 && <ModsEmptyCard />}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {loading ? (
          Array.from({ length: 9 }).map((_, idx) => (
            <ModuleCardDetailLoading key={idx} />
          ))
        ) : (
          <>
            {filteredModules.map(([code, moduleData], idx) => (
              <ModuleCardDetail
                key={idx}
                code={code}
                moduleData={moduleData as unknown as Module}
              />
            ))}
          </>
        )}
      </div>

      {/* Infinite scroll loader */}
      {!allModulesLoaded && <div ref={loaderRef} className="h-4" />}

      {isLoadingMore && (
        <div className="flex justify-center py-4">
          <div className="text-sm text-muted-foreground">Loading more...</div>
        </div>
      )}

      <p className="text-center text-sm text-muted-foreground transition-colors hover:text-primary-alt">
        <Link
          href="https://wis.ntu.edu.sg/webexe/owa/aus_subj_cont.main"
          target="_blank">
          Updated as at AY{year}/{parseInt(year) + 1}
        </Link>
      </p>
    </div>
  )
}

export default ModsPage
