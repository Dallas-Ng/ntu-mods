import Link from "next/link"
import { M_DATA } from "@/data/2023/m-data"
import { M_DATA_S1 } from "@/data/2023/m-data-s1"
import { M_DATA_S2 } from "@/data/2023/m-data-s2"

import { MODULE_CATEGORY } from "@/lib/constants"
import { getModuleCategories } from "@/lib/get-module-category"
import { getModuleFaculty } from "@/lib/get-module-faculty"
import Header from "@/components/header"
import ModsEmptyCard from "@/components/mods/mods-empty-card"
import {
  ModsFacultySelect,
  SearchModuleFaculty
} from "@/components/mods/mods-faculty-select"
import {
  ModsLevelSelect,
  SearchModuleLevel
} from "@/components/mods/mods-module-level-select"
import {
  ModsModuleTypeSelect,
  SearchModuleType
} from "@/components/mods/mods-module-type-select"
import ModsSearchInput from "@/components/mods/mods-search-input"
import {
  ModsSemesterSelect,
  Semester
} from "@/components/mods/mods-semester-select"

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
    semester = "s2",
    moduleType = "all",
    moduleFaculty = "all",
    moduleLevel = "all"
  } = searchParams

  // Semseter Data
  const MODULE_DATA =
    semester === "s2" ? M_DATA_S2 : semester === "s1" ? M_DATA_S1 : M_DATA

  let filteredModules = Object.entries(MODULE_DATA)
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
        getModuleFaculty(moduleData.searchKeys) === moduleFaculty
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
        <ModsFacultySelect paramsValue={moduleFaculty} />

        <div className="flex gap-2">
          <ModsModuleTypeSelect paramsValue={moduleType} />
        </div>

        <div className="flex gap-2">
          <ModsSemesterSelect paramsValue={semester} />

          <ModsLevelSelect
            searchTerm={searchTerm}
            paramValue={moduleLevel}
            modules={filteredModsExcludingLevel}
            filterModsLength={filteredModules.length}
          />
        </div>
      </div>

      <hr className="py-2" />

      {filteredModules.length === 0 && <ModsEmptyCard />}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {filteredModules.map(([code, moduleData]) => (
          <Link key={code} href={`/mods/${code}`}>
            <div className="rounded-lg border-2 p-3 transition-colors hover:bg-accent">
              <p className="text-sm text-muted-foreground">{moduleData.code}</p>

              <p className="truncate">{moduleData.title}</p>

              <div className="mt-4 flex items-center justify-between text-xs">
                <div className="flex gap-1 text-muted-foreground">
                  {getModuleCategories(moduleData.searchKeys).map(
                    (category, i) => (
                      <div key={i} className="rounded-full border px-2 py-0">
                        <span key={i}>{MODULE_CATEGORY[category]}</span>
                      </div>
                    )
                  )}
                </div>

                <div className="text-sm text-muted-foreground">
                  {getModuleFaculty(moduleData.searchKeys)}
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <p className="text-center text-sm text-muted-foreground transition-colors hover:text-primary-alt">
        <Link
          href="https://wis.ntu.edu.sg/webexe/owa/aus_subj_cont.main"
          target="_blank">
          Updated as at AY2023/2024
        </Link>
      </p>
    </div>
  )
}

export default ModsPage
