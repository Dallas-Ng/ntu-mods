import { TimetableTable } from "../timetable-table/table"

interface Props {
  indexes: Record<string, Index[]>
}

const ModsIndexTable = ({ indexes }: Props) => {
  if (Object.values(indexes).length === 0) {
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
      moduleIndexMap={indexes}
      hideIndex
      fullCell
      showModuleKeyAsCommon
      alwaysHighlightLectures
    />
  )
}

export default ModsIndexTable
