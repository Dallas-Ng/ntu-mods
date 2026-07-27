import type { PrecomputedTimetableMatrix } from "../timetable-table/table"
import { TimetableTable } from "../timetable-table/table"

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
