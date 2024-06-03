"use client"

import useSWR from "swr"

import { ApiModuleIndexes } from "@/types/api.types"
import { get } from "@/lib/api"

import { TimetableTable } from "../timetable-table/table"

interface Props {
  moduleKey: string
}

const ModsIndexTable = ({ moduleKey }: Props) => {
  const key = `/modules/${moduleKey}/indexes`
  const { data } = useSWR(key, () => get<ApiModuleIndexes>(key))

  const moduleIndexes = data?.indexes || {}

  if (Object.values(moduleIndexes).length === 0) {
    return (
      <div className="rounded-md border p-2 py-5 text-center">
        <p className="w-full text-muted-foreground">
          No indexes available for this semester
        </p>
      </div>
    )
  }

  return (
    <TimetableTable
      moduleIndexMap={moduleIndexes}
      hideIndex
      fullCell
      showModuleKeyAsCommon
      alwaysHighlightLectures
    />
  )
}

export default ModsIndexTable
