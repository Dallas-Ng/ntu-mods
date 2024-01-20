"use client"

import { getModuleIndexMap } from "@/lib/get-module-index-map"
import { useTimetable } from "@/hooks/use-timetable"

import { TimetableTable } from "../timetable-table/table"

interface Props {
  timetable?: Timetable
}

const TimetablePageTable = (props: Props) => {
  const { timetable } = useTimetable(props.timetable)
  const moduleIndexMap = getModuleIndexMap(timetable)

  return <TimetableTable moduleIndexMap={moduleIndexMap} />
}

export default TimetablePageTable
