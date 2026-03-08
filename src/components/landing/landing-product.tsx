import { getModuleIndexesData } from "@/lib/server/get-module-indexes-data"

import { TimetableTable } from "../timetable-table/table"

const TEMPLATE_COURSES: Record<string, string> = {
  // Make sure these indexes actually exist in the database
  // MA3003: "23285",
  HR2008: "17289",
  IE3102: "33110",
  BG2119: "55067",
  IM3180: "36001",
  BH3605: "00798",
  LF5003: "18045"
}

const LANDING_YEAR = "2025"
const LANDING_SEMESTER = "2"

const LandingProduct = async () => {
  const moduleIndexMap: TimetableWithIndex = {}

  await Promise.all(
    Object.entries(TEMPLATE_COURSES).map(async ([code, indexKey]) => {
      const allIndexes = await getModuleIndexesData(
        code,
        LANDING_YEAR,
        LANDING_SEMESTER
      )
      const slots = allIndexes[indexKey]
      if (slots?.length) moduleIndexMap[code] = slots
    })
  )

  return (
    <div className="relative h-[48.5vh] w-full justify-center overflow-hidden rounded-lg border-4 bg-background shadow-xl dark:bg-slate-950">
      <TimetableTable moduleIndexMap={moduleIndexMap} fullCell />
    </div>
  )
}

export default LandingProduct
