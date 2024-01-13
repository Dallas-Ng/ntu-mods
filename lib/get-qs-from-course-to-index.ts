export function getQsFromCourseToIndexes(coursesToIndex: CourseIndex) {
  const cleanedCoursesToIndex: { [key: string]: string } = {}

  Object.entries(coursesToIndex).forEach(([courseKey, courseVal]) => {
    cleanedCoursesToIndex[courseKey] = courseVal[0].key.toString()
  })

  return cleanedCoursesToIndex
}
