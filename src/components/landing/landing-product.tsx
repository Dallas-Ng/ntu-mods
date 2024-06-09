import { getModuleIndexMap } from "@/lib/get-module-index-map"

import { TimetableTable } from "../timetable-table/table"

const TEMPLATE_COURSES = {
  // Make sure these indexes actually exist in the database
  // MA3003: "23285",
  HR2008: "17289",
  IE3102: "33110",
  BG2119: "55067",
  IM3180: "36001",
  BH3605: "00798",
  LF5003: "18045"
}

const moduleIndexMap = getModuleIndexMap(TEMPLATE_COURSES)

const LandingProduct = () => {
  return (
    <div className="relative h-[48.5vh] w-full justify-center overflow-hidden rounded-lg border-4 bg-background shadow-xl dark:bg-slate-950">
      <TimetableTable moduleIndexMap={moduleIndexMap} fullCell />
    </div>
  )
}

export default LandingProduct
