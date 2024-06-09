"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

import { getModuleCategories } from "@/lib/get-module-category"
import { getModuleFaculty } from "@/lib/get-module-faculty"
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

const ModsPage = ({ searchParams }: Props) => {
  const {
    searchTerm = "",
    semester = "s1",
    moduleType = "all",
    moduleFaculty = "all",
    moduleLevel = "all"
  } = searchParams

  const [modules, setModules] = useState<{ [moduleKey: string]: Module }>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadModule = async () => {
      setLoading(true)
      let modulesToLoad: { [moduleKey: string]: Module } = {}

      // if (semester === "s2")
      //   modulesToLoad = (await import("@/data/2024/m-data-s2")).M_DATA_S2

      if (semester === "s1")
        modulesToLoad = (await import("@/data/2024/m-data-s1")).M_DATA_S1

      // if (semester === "all")
      //   modulesToLoad = (await import("@/data/2024/m-data")).M_DATA

      setModules(modulesToLoad)
      setLoading(false)
    }

    loadModule()
  }, [semester])

  let filteredModules = Object.entries(modules)
  let filteredModsExcludingLevel: [string, Module][] = []

  /**
   *
   */
  if (searchTerm.length === 2) {
    // Assume its a module code prefix
    filteredModules = filteredModules.filter(([moduleKey, _]) =>
      moduleKey.toLowerCase().startsWith(searchTerm.toLowerCase())
    )
  } else {
    // Filter by module name or tilte
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
      getModuleCategories(moduleData.searchKeys).includes(
        moduleType as ModuleType
      )
    )
  }

  // Filter by module faculty
  if (moduleFaculty !== "all") {
    filteredModules = filteredModules.filter(
      ([_, moduleData]) =>
        getModuleFaculty(moduleData.code, moduleData.searchKeys) ===
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
        subtitle={`Filtered down to ${filteredModules.length} modules.`}
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
            modules={filteredModsExcludingLevel}
            filterModsLength={filteredModules.length}
          />
        </div>
      </div>

      <hr className="py-2" />

      {!loading && filteredModules.length === 0 && <ModsEmptyCard />}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {loading ? (
          Array.from({ length: 9 }).map((_, idx) => (
            <ModuleCardDetailLoading key={idx} />
          ))
        ) : (
          <>
            {filteredModules.map(([code, moduleData], idx) => (
              <ModuleCardDetail key={idx} code={code} moduleData={moduleData} />
            ))}
          </>
        )}
      </div>

      <p className="text-center text-sm text-muted-foreground transition-colors hover:text-primary-alt">
        <Link
          href="https://wis.ntu.edu.sg/webexe/owa/aus_subj_cont.main"
          target="_blank">
          Updated as at AY2024/2025
        </Link>
      </p>
    </div>
  )
}

export default ModsPage
