import { useMemo } from "react"
import { useSearchParams } from "next/navigation"

export const useQsTimetable = (): Timetable | undefined => {
  const searchParams = useSearchParams()

  return useMemo(() => {
    const obj = Object.fromEntries(searchParams.entries())

    if (Object.keys(obj).length === 0) {
      return undefined
    }

    const timetable: Timetable = {}

    Object.entries(obj).forEach(([key, value]) => {
      timetable[key] = value
    })

    return timetable
  }, [searchParams])
}
