import Link from "next/link"
import { M_DATA } from "@/data/2023/m-data"
import { M_DATA_S1 } from "@/data/2023/m-data-s1"
import { M_DATA_S2 } from "@/data/2023/m-data-s2"

import { areObjectsEqual } from "@/lib/are-objects-equal"
import { MODULE_CATEGORY, MODULE_FACULTY } from "@/lib/constants"
import { getModuleCategories } from "@/lib/get-module-category"
import { getModuleFaculty } from "@/lib/get-module-faculty"
import Header from "@/components/header"
import {
  ModsFacultySelect,
  SearchModuleFaculty
} from "@/components/mods/mods-faculty-select"
import ModuleCardList from "@/components/mods/mods-module-card-list"
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

const DEFAULT_FILTERS = {
  dbSearchTerm: "",
  semester: "s2",
  moduleType: "all",
  moduleFaculty: "all",
  moduleLevel: "all"
}

interface Props {
  searchParams: {
    dbSearchTerm?: string
    semester?: Semester
    moduleType?: SearchModuleType
    moduleFaculty?: SearchModuleFaculty
    moduleLevel?: SearchModuleLevel
  }
}

const ModsPage = ({ searchParams }: Props) => {
  let {
    dbSearchTerm = "",
    semester = "s2",
    moduleType = "all",
    moduleFaculty = "all",
    moduleLevel = "all"
  } = searchParams

  // Semseter Data
  const MODULE_DATA =
    semester === "s2" ? M_DATA_S2 : semester === "all" ? M_DATA : M_DATA_S1

  let filteredModules = Object.entries(MODULE_DATA)
  let filteredModsExcludingLevel = filteredModules

  // Don't show all modules if no filters are applied
  // This is to prevent the page from being too long and reduce compute time
  const noChangedFilters = areObjectsEqual(
    { dbSearchTerm, semester, moduleType, moduleFaculty, moduleLevel },
    DEFAULT_FILTERS
  )

  // Validate Filters, else set to All
  // TODO: fix the search params
  semester = ["s1", "s2", "all"].includes(semester) ? semester : "all"
  moduleType = Object.keys(MODULE_CATEGORY).includes(moduleType)
    ? moduleType
    : "all"
  moduleFaculty = Object.keys(MODULE_FACULTY).includes(moduleFaculty)
    ? moduleFaculty
    : "all"

  if (noChangedFilters) {
    // filteredModules = []
  } else {
    // Assume its a module code prefix
    if (dbSearchTerm.length === 2) {
      filteredModules = filteredModules.filter(([moduleKey, _]) =>
        moduleKey.toLowerCase().startsWith(dbSearchTerm.toLowerCase())
      )
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

    if (dbSearchTerm.length !== 2) {
      // Filter by module name or tilte
      filteredModules = filteredModules.filter(([moduleKey, moduleData]) => {
        return (
          moduleKey.toLowerCase().includes(dbSearchTerm.toLowerCase()) ||
          moduleData.title.toLowerCase().includes(dbSearchTerm.toLowerCase())
        )
      })
    }

    // Used to persist module level select
    filteredModsExcludingLevel = filteredModules

    if (moduleLevel !== "all") {
      filteredModules = filteredModules.filter(
        ([moduleKey, _]) => moduleKey.slice(2, 3) === moduleLevel
      )
    }
  }

  return (
    <div className="relative space-y-3">
      <Header
        title="NTU Modules"
        subtitle={
          noChangedFilters
            ? "Search for a module below!"
            : `Filtered down to ${filteredModules.length} modules.`
        }
      />

      <div className="flex w-full flex-col gap-2 lg:flex-row">
        <ModsSearchInput defaultValue={dbSearchTerm} />
        <ModsFacultySelect defaultValue={moduleFaculty} />

        <div className="flex gap-2">
          <ModsModuleTypeSelect defaultValue={moduleType} />
        </div>

        <div className="flex gap-2">
          <ModsSemesterSelect defaultValue={semester} />

          <ModsLevelSelect
            searchTerm={dbSearchTerm}
            defaultValue={moduleLevel}
            modules={filteredModsExcludingLevel}
            filterModsLength={filteredModules.length}
          />
        </div>
      </div>

      <hr className="py-2" />

      {!noChangedFilters && filteredModules.length === 0 && (
        <div className="flex h-20 w-full items-center rounded-md border text-center">
          <p className="w-full text-center">
            There are no modules found
            <br />
            <span className="text-muted-foreground">
              Try changing your filters
            </span>
          </p>
        </div>
      )}

      <ModuleCardList filteredModules={filteredModules} />

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
