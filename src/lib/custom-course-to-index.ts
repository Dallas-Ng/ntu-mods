import { PRESET_INDEX_TYPES } from "./custom-course-colors"

const toMinutes = (hhmm: number) =>
  Math.floor(hhmm / 100) * 60 + (hhmm % 100)

const padHhmm = (n: number) => String(n).padStart(4, "0")

const toIndexType = (type: string): IndexType =>
  PRESET_INDEX_TYPES.has(type) ? (type as IndexType) : "LEC"

const sessionToIndex = (
  course: CustomCourse,
  session: CustomCourseSession
): Index => ({
  key: `${course.id}_${session.type}`,
  type: toIndexType(session.type),
  group: course.name,
  day: session.day,
  time: `${padHhmm(session.startTime)}-${padHhmm(session.endTime)}`,
  venue: session.venue,
  remarks: session.type, // session type label shown in cell
  duration: (toMinutes(session.endTime) - toMinutes(session.startTime)) / 30
})

export const customCoursesToIndexMap = (
  courses: CustomCourse[]
): TimetableWithIndex => {
  const map: TimetableWithIndex = {}
  for (const course of courses) {
    if (!course.sessions?.length) continue
    const moduleKey = `__CC__${course.id}`
    map[moduleKey] = course.sessions.map((s) => sessionToIndex(course, s))
  }
  return map
}
