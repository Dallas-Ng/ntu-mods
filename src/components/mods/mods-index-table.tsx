import { getModuleIndexes } from "@/lib/get-module-indexes"

import { TimetableTable } from "../timetable-table/table"

interface Props {
  moduleKey: string
}

const ModsIndexTable = ({ moduleKey }: Props) => {
  const moduleIndexes = getModuleIndexes(moduleKey)

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
