import { getModuleIndexes } from "@/lib/get-module-indexes"

import { TimetableTable } from "../timetable-table/table"

interface Props {
  moduleKey: string
}

const ModsIndexTable = ({ moduleKey }: Props) => {
  const moduleIndexes = getModuleIndexes(moduleKey)

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
