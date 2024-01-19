import { useSearchParams } from "next/navigation"

export const useQsTimetable = (): Timetable | undefined => {
  const searchParams = useSearchParams()
  const obj = Object.fromEntries(searchParams.entries())

  if (Object.keys(obj).length === 0) {
    return undefined
  }

  const timetable: Timetable = {}

  Object.entries(obj).forEach(([key, value]) => {
    // TODO: Add in validation here
    // if (key not in M_DATA || value not in M_DATA[key]) {
    //  return
    // }

    timetable[key] = value
  })

  return timetable
}
