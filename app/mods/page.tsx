"use client"

import Link from "next/link"
import useSWR from "swr"

import { ApiModules } from "@/types/api.types"
import { get } from "@/lib/api"
import { useDebounce } from "@/hooks/use-debounce"
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
import {
  ModuleCardDetail,
  ModuleCardDetailLoading
} from "@/components/module-card"

interface Props {
  searchParams: {
    searchTerm?: string
    semester?: Semester
    type?: SearchModuleType
    faculty?: SearchModuleFaculty
    level?: SearchModuleLevel
  }
}

const ModsPage = ({ searchParams }: Props) => {
  const {
    searchTerm = "",
    semester = "s1",
    type = "all",
    faculty = "all",
    level = "all"
  } = searchParams

  const dbSearchParams = useDebounce(searchParams, 100)

  const { data, isLoading } = useSWR(["/modules", dbSearchParams], () =>
    get<ApiModules>("/modules", dbSearchParams)
  )

  const filteredModules = data?.modules || []
  const moduleLevels = data?.moduleLevels || []

  return (
    <div className="relative space-y-3">
      <Header
        title="NTU Modules"
        subtitle={`Filtered down to ${data?.total} modules.`}
      />

      <div className="flex w-full flex-col gap-2 lg:flex-row">
        <ModsSearchInput paramsValue={searchTerm} />
        <ModsFacultySelect paramsValue={faculty} />

        <div className="flex gap-2">
          <ModsModuleTypeSelect paramsValue={type} />
        </div>

        <div className="flex gap-2">
          <ModsSemesterSelect paramsValue={semester} />

          <ModsLevelSelect
            searchTerm={searchTerm}
            paramValue={level}
            moduleLevels={moduleLevels}
            filterModsLength={filteredModules.length}
          />
        </div>
      </div>

      <hr className="py-2" />

      {!isLoading && filteredModules.length === 0 && <ModsEmptyCard />}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, idx) => (
            <ModuleCardDetailLoading key={idx} />
          ))
        ) : (
          <>
            {filteredModules.map((module, idx) => (
              <ModuleCardDetail
                key={idx}
                code={module.code}
                moduleData={module}
              />
            ))}
          </>
        )}
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
