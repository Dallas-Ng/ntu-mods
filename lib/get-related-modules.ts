import { TRUN_COURSE_CONTENT } from "@/data/truncated-course-content"

import { getModuleData } from "./get-module-data"

/**
 * Retrieves an array of related modules based on the given module key.
 * A related module is defined as a module with the same course prefix and a course number difference of 999 or less.
 */
export function getRelatedModules(moduleKey: string, limit = 0): CourseData[] {
  let relatedModules: CourseData[] = []
  const keyPrefix = moduleKey.slice(0, 2)

  const moduleKeys = Object.entries(TRUN_COURSE_CONTENT).filter(
    ([relatedModuleKey]) => {
      const coursePrefix = relatedModuleKey.slice(0, 2)

      return coursePrefix === keyPrefix && relatedModuleKey !== moduleKey
    }
  )

  // Limit the number of related modules
  if (limit > 0) moduleKeys.splice(limit)

  if (moduleKeys.length > 0) {
    relatedModules = moduleKeys
      .map(([moduleKey]) => getModuleData(moduleKey))
      .filter((x) => x) as CourseData[]
  }

  return relatedModules
}
