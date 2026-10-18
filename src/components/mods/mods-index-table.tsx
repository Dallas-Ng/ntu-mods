import type { PrecomputedTimetableMatrix } from "../timetable-table/table"
import { TimetableTable } from "../timetable-table/table"

interface Props {
  indexes: Record<string, Index[]>
  precomputedMatrix?: PrecomputedTimetableMatrix
}

const ModsIndexTable = ({ indexes, precomputedMatrix }: Props) => {
  if (Object.values(indexes).length === 0) {
    return (
      <div className="bg-muted rounded-2xl p-5 text-center text-sm">
        <p className="text-muted-foreground">
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
