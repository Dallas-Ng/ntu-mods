"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"

import { useLatestSemester } from "@/hooks/use-latest-semester"
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
import { ModsCurrentOnlyToggle } from "@/components/mods/mods-current-only-toggle"
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
    currentOnly?: string
  }
}

interface ModuleData {
  code: string
  title: string
  au: string
  searchKeys: string[]
  notAvailableToProgramme?: string
  isCurrentSemester?: boolean
  latestYear?: string
  latestSemester?: string
}

const ModsPage = ({ searchParams }: Props) => {
  const {
    searchTerm = "",
    moduleType = "all",
    moduleLevel = "all",
    currentOnly = "true"
  } = searchParams

  const { year, semester } = useLatestSemester()
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
          skip: skip.toString(),
          limit: "100"
        })

        if (searchTerm) params.set("q", searchTerm)
        if (moduleType !== "all") params.set("type", moduleType)
        if (moduleLevel !== "all") params.set("level", moduleLevel)
        if (currentOnly === "true") params.set("currentOnly", "true")

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
    [year, semester, searchTerm, moduleType, moduleLevel, currentOnly]
  )

  // Reload from scratch whenever year, semester, or filters change
  useEffect(() => {
    setModules([])
    setAllModulesLoaded(false)
    loadModules(0)
  }, [year, semester, searchTerm, moduleType, moduleLevel, currentOnly, loadModules])

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

  return (
    <div className="relative space-y-3">
      <Header
        title="NTU Modules"
        subtitle={`AY${year}/${parseInt(year) + 1} Semester ${semester}`}
      />

      <div className="flex w-full flex-col gap-2 lg:flex-row">
        <ModsSearchInput paramsValue={searchTerm} />
        {/* <ModsFacultySelect paramsValue={moduleFaculty} /> */}

        <div className="flex gap-2">
          <ModsModuleTypeSelect paramsValue={moduleType} />
        </div>

        <div className="flex gap-2">
          {/* <ModsSemesterSelect paramsValue={semester} /> */}

          <ModsLevelSelect searchTerm={searchTerm} paramValue={moduleLevel} />
        </div>

        <div className="flex items-center gap-2">
          <ModsCurrentOnlyToggle paramsValue={currentOnly} />
        </div>
      </div>

      <hr className="py-2" />

      {allModulesLoaded && modules.length === 0 && <ModsEmptyCard />}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {loading ? (
          Array.from({ length: 9 }).map((_, idx) => (
            <ModuleCardDetailLoading key={idx} />
          ))
        ) : (
          <>
            {modules.map((moduleData, idx) => (
              <ModuleCardDetail
                key={idx}
                code={moduleData.code}
                moduleData={moduleData}
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
