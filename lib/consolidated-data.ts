import CONSOLIDATED_INDEXES from "@/data/consolidated-2023-2-indexes.json"
import CONSOLIDATED_DATA from "@/data/consolidated-2023-2.json"

/**
 * TODO: ADD SAFETY CHECKING AND HANDLING
 * TEST: Remove .uppercase function in course-course-select.tsx
 */

export const C_DATA = CONSOLIDATED_DATA
export const C_INDEXES = CONSOLIDATED_INDEXES

export function getCDataCourse(courseKey: string): Course {
  return C_DATA[courseKey as keyof typeof C_DATA] as Course
}

export function getCDataCourseIndexes(courseKey: string) {
  return C_DATA[courseKey as keyof typeof C_DATA].indexes
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

  const courseIndexes = C_DATA[randomCourseKey as keyof typeof C_DATA].indexes

  const indexKeys = Object.keys(courseIndexes)
  const randomIndex = indexKeys[Math.floor(Math.random() * indexKeys.length)]

  const index = courseIndexes[randomIndex as keyof typeof courseIndexes][0]

  return { randomCourseKey, randomIndex: index }
}
