import EXAM_DATA from "@/data/2023-exams.json"
import CONSOLIDATED_INDEXES from "@/data/consolidated-2023-2-indexes.json"
import CONSOLIDATED_DATA from "@/data/consolidated-2023-2.json"
import CONDLIDATED_COURSE_DATA_2023_1 from "@/data/consolidated-course-content-2023-1.json"
import CONDLIDATED_COURSE_DATA_2023_2 from "@/data/consolidated-course-content-2023-2.json"

import { areObjectsEqual } from "./utils"

/**
 * TODO: ADD SAFETY CHECKING AND HANDLING
 * TEST: Remove .uppercase function in course-course-select.tsx
 */

export const C_DATA = CONSOLIDATED_DATA as Record<string, Course>
export const C_INDEXES = CONSOLIDATED_INDEXES as unknown as Record<
  string,
  Index[]
>
export const C_COURSE_DATA_2023_1 =
  CONDLIDATED_COURSE_DATA_2023_1 as unknown as Record<string, CourseData>
export const C_COURSE_DATA_2023_2 =
  CONDLIDATED_COURSE_DATA_2023_2 as unknown as Record<string, CourseData>

export const C_COURSE_DATA = {
  ...C_COURSE_DATA_2023_1,
  ...C_COURSE_DATA_2023_2
}

export const C_EXAMS = EXAM_DATA as unknown as Record<string, Exam>

export function getCourse(courseKey: string): Course {
  return C_DATA[courseKey] as Course
}

export function getCourseIndexes(courseKey: string): Record<string, Index[]> {
  return C_DATA[courseKey].indexes
}

export function getQsFromCourseToIndexes(coursesToIndex: CourseIndex) {
  const cleanedCoursesToIndex: { [key: string]: string } = {}

  Object.entries(coursesToIndex).forEach(([courseKey, courseVal]) => {
    cleanedCoursesToIndex[courseKey] = courseVal[0].key.toString()
  })

  return cleanedCoursesToIndex
}

export function getRandomCourseIndex() {
  const courseKeys = Object.keys(C_DATA)
  const randomCourseKey =
    courseKeys[Math.floor(Math.random() * courseKeys.length)]

  const courseIndexes = C_DATA[randomCourseKey].indexes

  const indexKeys = Object.keys(courseIndexes)
  const randomIndex = indexKeys[Math.floor(Math.random() * indexKeys.length)]

  const index = courseIndexes[randomIndex][0]

  return { randomCourseKey, randomIndex: index }
}

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
