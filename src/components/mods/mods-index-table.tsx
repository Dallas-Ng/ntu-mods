import dynamic from "next/dynamic"

import type { PrecomputedTimetableMatrix } from "../timetable-table/table"
import { TimetableTableLoader } from "../timetable-table/table-loader"

const TimetableTable = dynamic(
  () =>
    import("../timetable-table/table").then((m) => ({
      default: m.TimetableTable
    })),
  { loading: () => <TimetableTableLoader />, ssr: true }
)

interface Props {
  indexes: Record<string, Index[]>
  precomputedMatrix?: PrecomputedTimetableMatrix
}

const ModsIndexTable = ({ indexes, precomputedMatrix }: Props) => {
  if (Object.values(indexes).length === 0) {
    return (
      <div className="rounded-md border p-2 py-5 text-center">
        <p className="text-muted-foreground w-full">
          No indexes available for this semester
        </p>
      </div>
    )
  }

  return (
    <TimetableTable
      moduleIndexMap={indexes}
      precomputedMatrix={precomputedMatrix}
      hideIndex
      fullCell
      showModuleKeyAsCommon
      alwaysHighlightLectures
    />
  )
}

export default ModsIndexTable
