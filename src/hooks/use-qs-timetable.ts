import { useMemo } from "react"

import {
  CUSTOM_BLOCKS_PARAM,
  decodeCustomBlocksParam,
  RESERVED_SHARE_PARAMS
} from "@/lib/timetable-share"
import { useSearchParams } from "@/hooks/use-search-params"

export const useQsTimetable = (): Timetable | undefined => {
  const searchParams = useSearchParams()

  return useMemo(() => {
    const entries = [...searchParams.entries()].filter(
      ([key]) => !RESERVED_SHARE_PARAMS.has(key)
    )

    // A link carrying only custom blocks is still a shared timetable — an
    // empty one — so don't fall back to the viewer's own plan.
    if (entries.length === 0) {
      return searchParams.has(CUSTOM_BLOCKS_PARAM) ? {} : undefined
    }

    const timetable: Timetable = {}

    entries.forEach(([key, value]) => {
      timetable[key] = value
    })

    return timetable
  }, [searchParams])
}

/** Custom blocks travelling in a share link, if the sharer opted to include them. */
export const useQsCustomCourses = (): CustomCourse[] | undefined => {
  const searchParams = useSearchParams()
  const encoded = searchParams.get(CUSTOM_BLOCKS_PARAM)

  return useMemo(
    () => (encoded ? decodeCustomBlocksParam(encoded) : undefined),
    [encoded]
  )
}
