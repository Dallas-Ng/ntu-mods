import Link from "next/link"
import { M_DATA } from "@/data/2023/m-data"
import { M_DATA_S1 } from "@/data/2023/m-data-s1"
import { M_DATA_S2 } from "@/data/2023/m-data-s2"

import { MODULE_CATEGORY } from "@/lib/constants"
import { getModuleCategories } from "@/lib/get-module-category"
import { getModuleFaculty } from "@/lib/get-module-faculty"
import Header from "@/components/header"
import {
  ModsFacultySelect,
  SearchModuleFaculty
} from "@/components/mods/mods-faculty-select"
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
    dbSearchTerm?: string
    semester?: Semester
    moduleType?: SearchModuleType
    moduleFaculty?: SearchModuleFaculty
  }
}

const TestPage = ({ searchParams }: Props) => {
  const {
    dbSearchTerm = "",
    semester = "s2",
    moduleType = "all",
    moduleFaculty = "all"
  } = searchParams

  // Semseter Data
  const MODULE_DATA =
    semester === "s2" ? M_DATA_S2 : semester === "all" ? M_DATA : M_DATA_S1

  let filteredModules = Object.entries(MODULE_DATA)

  // Assume its a module code prefix
  if (dbSearchTerm.length === 2) {
    filteredModules = filteredModules.filter(([moduleKey, _]) => {
      return moduleKey.toLowerCase().startsWith(dbSearchTerm.toLowerCase())
    })
  }

  // Filter by module type
  filteredModules = filteredModules.filter(([_, moduleData]) => {
    if (moduleType === "all") return true
    return getModuleCategories(moduleData.searchKeys).includes(moduleType)
  })

  // Filter by module faculty
  filteredModules = filteredModules.filter(([_, moduleData]) => {
    if (moduleFaculty === "all") return true
    return getModuleFaculty(moduleData.searchKeys) === moduleFaculty
  })

  // Filter by module name or tilte
  filteredModules = filteredModules.filter(([moduleKey, moduleData]) => {
    return (
      moduleKey.toLowerCase().includes(dbSearchTerm.toLowerCase()) ||
      moduleData.title.toLowerCase().includes(dbSearchTerm.toLowerCase())
    )
  })

  return (
    <div className="relative space-y-3">
      <Header
        title="NTU Modules"
        subtitle={<p>Filtered down to {filteredModules.length} modules.</p>}
      />

      <div className="flex w-full flex-col gap-2 lg:flex-row">
        <ModsSearchInput defaultValue={dbSearchTerm} />
        <ModsFacultySelect defaultValue={moduleFaculty} />

        <div className="flex gap-2">
          <ModsSemesterSelect defaultValue={semester} />
          <ModsModuleTypeSelect defaultValue={moduleType} />
        </div>
      </div>

      <hr className="py-2" />

      {filteredModules.length === 0 && (
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

export default TestPage
