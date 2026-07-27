import {
  customCourseModuleKey,
  PRESET_INDEX_TYPES
} from "@/lib/custom-course-colors"

const toMinutes = (hhmm: number) => Math.floor(hhmm / 100) * 60 + (hhmm % 100)

const padHhmm = (n: number) => String(n).padStart(4, "0")

/**
 * Custom session labels are free text. Map the preset ones onto their real
 * IndexType so type-aware generation settings still apply, and fall back to
 * LEC for user-defined labels like "Gym".
 */
const toIndexType = (sessionType: string): IndexType =>
  PRESET_INDEX_TYPES.has(sessionType) ? (sessionType as IndexType) : "LEC"

const sessionToIndex = (
  course: CustomCourse,
  courseIndex: CustomCourseIndex,
  session: CustomCourseSession
): Index => ({
  // Shared across every session of the variant, mirroring how a module index
  // key is shared by all of its slots — the index picker relies on this.
  key: courseIndex.id,
  type: toIndexType(session.type),
  group: course.name,
  day: session.day,
  time: `${padHhmm(session.startTime)}-${padHhmm(session.endTime)}`,
  venue: session.venue,
  remarks: session.type, // session type label — used for color lookup and display
  duration: (toMinutes(session.endTime) - toMinutes(session.startTime)) / 30,
  isCustom: true
})

export const getSelectedCustomCourseIndex = (
  course: CustomCourse
): CustomCourseIndex | undefined =>
  course.indexes?.find((i) => i.id === course.selectedIndexId) ??
  course.indexes?.[0]

const courseIndexToSlots = (
  course: CustomCourse,
  courseIndex: CustomCourseIndex
): Index[] =>
  courseIndex.sessions.map((s) => sessionToIndex(course, courseIndex, s))

/**
 * Slots of the currently selected variant of each custom block — what the
 * timetable grid renders.
 */
export const customCoursesToIndexMap = (
  courses: CustomCourse[]
): TimetableWithIndex => {
  const map: TimetableWithIndex = {}
  for (const course of courses) {
    const selected = getSelectedCustomCourseIndex(course)
    if (!selected?.sessions?.length) continue
    map[customCourseModuleKey(course.id)] = courseIndexToSlots(course, selected)
  }
  return map
}

/**
 * Every variant of every custom block, in the same shape as the season index
 * data, so the generator can treat custom blocks like any other module.
 */
export const customCoursesToAllIndexes = (
  courses: CustomCourse[]
): Record<string, Indexes> => {
  const map: Record<string, Indexes> = {}
  for (const course of courses) {
    const indexes: Indexes = {}
    for (const courseIndex of course.indexes ?? []) {
      if (!courseIndex.sessions?.length) continue
      indexes[courseIndex.id] = courseIndexToSlots(course, courseIndex)
    }
    if (Object.keys(indexes).length > 0) {
      map[customCourseModuleKey(course.id)] = indexes
    }
  }
  return map
}
