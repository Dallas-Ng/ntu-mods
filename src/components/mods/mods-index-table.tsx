"use client"

import dynamic from "next/dynamic"

import { getModuleIndexes } from "@/lib/get-module-indexes"

import { TimetableTableLoader } from "../timetable-table/table"

const TimetableTable = dynamic(
  () => import("@/components/timetable-table/table"),
  {
    ssr: false,
    loading: () => <TimetableTableLoader />
  }
)

interface Props {
  moduleKey: string
}

const ModsIndexTable = ({ moduleKey }: Props) => {
  const moduleIndexes = getModuleIndexes(moduleKey)

  if (Object.values(moduleIndexes).length === 0) {
    return (
      <div className="rounded-md border p-2 py-5 text-center">
        <p className="w-full text-muted-foreground">
          No indexes available for this semester <br />
          <span className="text-sm">
            (This might be an old module not longer offered in AY24/25)
          </span>
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
