import { getModuleIndexMap } from "@/lib/get-module-index-map"

import { TimetableTable } from "../timetable-table/table"

const TEMPLATE_COURSES = {
  // Make sure these indexes actually exist in the database
  MH1812: "10122",
  MH1810: "50001",
  CC0007: "83019",
  BA2204: "00187",
  IM2073: "32361",
  EE4208: "32263",
  AD1101: "00085"
}

const moduleIndexMap = getModuleIndexMap(TEMPLATE_COURSES)

const LandingProduct = () => {
  return (
    <div className="relative h-[59vh] w-full justify-center overflow-hidden rounded-lg border-4 bg-background shadow-xl dark:bg-slate-950">
      <TimetableTable moduleIndexMap={moduleIndexMap} fullCell />
    </div>
  )
}

export default LandingProduct
