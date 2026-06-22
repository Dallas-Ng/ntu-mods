const toMinutes = (hhmm: number) =>
  Math.floor(hhmm / 100) * 60 + (hhmm % 100)

const padHhmm = (n: number) => String(n).padStart(4, "0")

export const customCourseToIndex = (course: CustomCourse): Index => {
  const duration = (toMinutes(course.endTime) - toMinutes(course.startTime)) / 30

  return {
    key: course.id,
    type: "LEC", // arbitrary; rendering is overridden by color
    group: course.name,
    day: course.day,
    time: `${padHhmm(course.startTime)}-${padHhmm(course.endTime)}`,
    venue: course.venue,
    remarks: "",
    duration,
    color: course.color
  }
}

export const customCoursesToIndexMap = (
  courses: CustomCourse[]
): TimetableWithIndex => {
  const map: TimetableWithIndex = {}
  for (const course of courses) {
    const moduleKey = `__CC__${course.id}`
    map[moduleKey] = [customCourseToIndex(course)]
  }
  return map
}
