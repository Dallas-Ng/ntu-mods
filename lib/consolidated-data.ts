import CONSOLIDATED_DATA from "@/data/consolidated-2023-2.json"

/**
 * TODO: ADD SAFETY CHECKING AND HANDLING
 * TEST: Remove .uppercase function in course-course-select.tsx
 */

export const C_DATA = CONSOLIDATED_DATA

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
