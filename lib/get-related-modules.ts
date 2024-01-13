import { C_COURSE_DATA } from "@/data/consolidated-course-content-2023"

/**
 * Retrieves an array of related modules based on the given module key.
 * A related module is defined as a module with the same course prefix and a course number difference of 999 or less.
 */
export function getRelatedModules(moduleKey: string): CourseData[] {
  const keyPrefix = moduleKey.slice(0, 2)
  const keyNumber = +moduleKey.slice(2) // Convert to number

  const relatedModules = Object.values(C_COURSE_DATA).filter((courseData) => {
    if (courseData.code.length === 6) {
      const { code } = courseData
      const coursePrefix = code.slice(0, 2)
      const courseNumber = +code.slice(2) // Convert to number

      return (
        coursePrefix === keyPrefix &&
        Math.abs(courseNumber - keyNumber) <= 999 &&
        moduleKey !== code // Exclude the module itself
      )
    }
    return false
  })

  return relatedModules
}
