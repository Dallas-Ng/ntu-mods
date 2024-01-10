import EXAM_DATA from "@/data/2023-exams.json"
import CONSOLIDATED_INDEXES from "@/data/consolidated-2023-2-indexes.json"
import CONSOLIDATED_DATA from "@/data/consolidated-2023-2.json"
import CONDLIDATED_COURSE_DATA from "@/data/consolidated-course-content-2023-2.json"

/**
 * TODO: ADD SAFETY CHECKING AND HANDLING
 * TEST: Remove .uppercase function in course-course-select.tsx
 */

export const C_DATA = CONSOLIDATED_DATA as Record<string, Course>
export const C_INDEXES = CONSOLIDATED_INDEXES as unknown as Record<
  string,
  Index[]
>
export const C_COURSE_DATA = CONDLIDATED_COURSE_DATA as unknown as Record<
  string,
  CourseData
>
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
