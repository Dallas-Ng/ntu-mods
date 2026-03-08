"use client"

import { useAcademicContextHook } from "@/hooks/use-academic-context"
import { useTimetable } from "@/hooks/use-timetable"
import { useTimetableIndexes } from "@/hooks/use-timetable-indexes"

import { TimetableTable, TimetableTableLoader } from "../timetable-table/table"

interface Props {
  timetable?: Timetable
}

const TimetablePageTable = (props: Props) => {
  const { timetable } = useTimetable(props.timetable)
  const { year, semester } = useAcademicContextHook()
  const { moduleIndexMap, isLoading } = useTimetableIndexes(
    timetable,
    year,
    semester
  )

  if (isLoading && !Object.keys(moduleIndexMap).length) {
    return <TimetableTableLoader />
  }

  return <TimetableTable moduleIndexMap={moduleIndexMap} />
}

export default TimetablePageTable
