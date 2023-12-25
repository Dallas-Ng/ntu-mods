import { useSearchParams } from "next/navigation"

import { C_DATA } from "@/lib/consolidated-data"

/**
 * Hook for extracting and processing course index data from the query string.
 *
 * @returns {CourseIndex} An object mapping course codes to their respective indexes.
 */
export function useQueryStringCTI(): CourseIndex {
  const searchParams = useSearchParams()
  const coursesToIndex: CourseIndex = {}

  const obj = Object.fromEntries(searchParams.entries())

  Object.entries(obj).forEach(([key, value]) => {
    const course = C_DATA[key as keyof typeof C_DATA]
    const indexes = course.indexes[value as keyof typeof course.indexes]
    coursesToIndex[key] = indexes
  })

  return coursesToIndex
}
