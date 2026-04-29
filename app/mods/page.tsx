"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"

import { getModuleCategories } from "@/lib/get-module-category"
import { useAllModules, type AllModule } from "@/hooks/use-all-modules"
import { useLatestSemester } from "@/hooks/use-latest-semester"
import Header from "@/components/header"
import { ModsCurrentOnlyToggle } from "@/components/mods/mods-current-only-toggle"
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
    currentOnly?: string
  }
}

const PAGE_SIZE = 100

function filterModules(
  modules: AllModule[],
  opts: {
    searchTerm: string
    moduleType: string
    moduleLevel: string
    currentOnly: boolean
  }
): AllModule[] {
  let filtered = modules

  if (opts.currentOnly) {
    filtered = filtered.filter((m) => m.isCurrentSemester)
  }

  if (opts.moduleType !== "all") {
    filtered = filtered.filter((m) =>
      getModuleCategories(m.searchKeys ?? []).includes(
        opts.moduleType as ModuleType
      )
    )
  }

  if (opts.moduleLevel !== "all") {
    filtered = filtered.filter((m) => m.code.slice(2, 3) === opts.moduleLevel)
  }

  if (opts.searchTerm) {
    const q = opts.searchTerm.toLowerCase()
    const isCodeQuery = /^[a-z]{2,4}\d*/i.test(q)
    if (isCodeQuery) {
      const codeMatches = filtered.filter((m) =>
        m.code.toLowerCase().includes(q)
      )
      const titleMatches = filtered.filter(
        (m) =>
          !m.code.toLowerCase().includes(q) && m.title.toLowerCase().includes(q)
      )
      filtered = [...codeMatches, ...titleMatches]
    } else {
      filtered = filtered.filter(
        (m) =>
          m.title.toLowerCase().includes(q) || m.code.toLowerCase().includes(q)
      )
    }
  }

  return filtered
}

const ModsPage = ({ searchParams }: Props) => {
  const {
    searchTerm = "",
    moduleType = "all",
    moduleLevel = "all",
    currentOnly = "true"
  } = searchParams

  const { year, semester } = useLatestSemester()
  const { modules: allModules, isLoading } = useAllModules()
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE)
  const loaderRef = useRef<HTMLDivElement>(null)

  const filteredModules = useMemo(
    () =>
      filterModules(allModules, {
        searchTerm,
        moduleType,
        moduleLevel,
        currentOnly: currentOnly === "true"
      }),
    [allModules, searchTerm, moduleType, moduleLevel, currentOnly]
  )

  const displayedModules = useMemo(
    () => filteredModules.slice(0, displayCount),
    [filteredModules, displayCount]
  )

  const hasMore = displayCount < filteredModules.length

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(PAGE_SIZE)
  }, [searchTerm, moduleType, moduleLevel, currentOnly])

  // Infinite scroll
  useEffect(() => {
    if (!loaderRef.current) return
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        setDisplayCount((c) => c + PAGE_SIZE)
      }
    })
    observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [hasMore])

  return (
    <div className="relative space-y-3">
      <Header
        title="NTU Modules"
        subtitle={`AY${year}/${parseInt(year) + 1} Semester ${semester}`}
      />

      <div className="flex w-full flex-col gap-2 lg:flex-row">
        <ModsSearchInput paramsValue={searchTerm} />

        <div className="flex gap-2">
          <ModsModuleTypeSelect paramsValue={moduleType} />
        </div>

        <div className="flex gap-2">
          <ModsLevelSelect searchTerm={searchTerm} paramValue={moduleLevel} />
        </div>

        <div className="flex items-center gap-2">
          <ModsCurrentOnlyToggle paramsValue={currentOnly} />
        </div>
      </div>

      <hr className="py-2" />

      {!isLoading && filteredModules.length === 0 && <ModsEmptyCard />}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 9 }).map((_, idx) => (
            <ModuleCardDetailLoading key={idx} />
          ))
        ) : (
          <>
            {displayedModules.map((moduleData, idx) => (
              <ModuleCardDetail
                key={idx}
                code={moduleData.code}
                moduleData={moduleData}
              />
            ))}
          </>
        )}
      </div>

      {!isLoading && hasMore && <div ref={loaderRef} className="h-4" />}

      {!isLoading && (
        <p className="text-center text-sm text-muted-foreground transition-colors hover:text-primary-alt">
          <Link
            href="https://wis.ntu.edu.sg/webexe/owa/aus_subj_cont.main"
            target="_blank">
            Updated as at AY{year}/{parseInt(year) + 1}
          </Link>
        </p>
      )}
    </div>
  )
}

export default ModsPage
