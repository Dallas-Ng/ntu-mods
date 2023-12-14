import C_DATA from "@/data/consolidated-2023-2.json"

/**
 * TODO: ADD SAFETY CHECKING AND HANDLING
 * TEST: Remove .uppercase function in course-course-select.tsx
 */

export function getCData() {
  return C_DATA
}

export function getCDataCourse(courseKey: string): Course {
  return C_DATA[courseKey as keyof typeof C_DATA] as Course
}

export function getCDataCourseIndexes(courseKey: string) {
  return C_DATA[courseKey as keyof typeof C_DATA].indexes
}
