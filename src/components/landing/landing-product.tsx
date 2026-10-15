import { getModuleIndexesData } from "@/lib/server/db/repo"

import { TimetableTable } from "../timetable-table/table"

const TEMPLATE_COURSES: Record<string, string> = {
  // Showcases all index types spread across Mon–Fri
  // LEC/STUDIO Mon 0930–1220, DES Wed 1330–1620
  EE4228: "32652",
  // LEC/STUDIO Mon 1630–1820, TUT Wed 0930–1020, LAB Thu 1030–1420
  BS1005: "08511",
  // LEC/STUDIO Fri 0830–0920, TUT Wed 1130–1320
  AAE18B: "39291",
  // PRJ Tue 1330–1620, LEC/STUDIO Wed 1630–1820
  EE2073: "32492",
  // SEM Thu 0830–1020
  AB0403: "00551"
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
    <div className="bg-background relative h-[48.5vh] min-h-[320px] w-full justify-center overflow-hidden rounded-2xl border shadow-2xl ring-4 ring-black/5 dark:ring-white/5 dark:bg-slate-950">
      <TimetableTable moduleIndexMap={moduleIndexMap} fullCell />
    </div>
  )
}

export default LandingProduct
