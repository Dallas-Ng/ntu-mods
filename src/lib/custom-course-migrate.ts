export const DEFAULT_CUSTOM_INDEX_LABEL = "Option 1"

export const makeCustomCourseIndex = (
  label: string,
  sessions: CustomCourseSession[]
): CustomCourseIndex => ({
  id: crypto.randomUUID(),
  label,
  sessions
})

/**
 * Custom blocks used to hold a single flat `sessions` array. Fold that into the
 * variant ("index") shape so older persisted state keeps working.
 */
export const normalizeCustomCourse = (course: CustomCourse): CustomCourse => {
  const indexes =
    course.indexes && course.indexes.length > 0
      ? course.indexes
      : [makeCustomCourseIndex(DEFAULT_CUSTOM_INDEX_LABEL, course.sessions ?? [])]

  const selectedIndexId = indexes.some((i) => i.id === course.selectedIndexId)
    ? course.selectedIndexId
    : indexes[0].id

  return { id: course.id, name: course.name, indexes, selectedIndexId }
}

export const normalizeCustomCourses = (
  courses: CustomCourse[][] | undefined
): CustomCourse[][] =>
  (courses ?? [[], [], [], [], []]).map((list) =>
    (list ?? []).map(normalizeCustomCourse)
  )

/** Deep copy with fresh ids — used when duplicating a plan. */
export const cloneCustomCourse = (course: CustomCourse): CustomCourse => {
  const normalized = normalizeCustomCourse(course)
  const indexes = normalized.indexes.map((i) => ({
    ...i,
    id: crypto.randomUUID(),
    sessions: i.sessions.map((s) => ({ ...s }))
  }))
  const selectedPos = normalized.indexes.findIndex(
    (i) => i.id === normalized.selectedIndexId
  )
  return {
    id: crypto.randomUUID(),
    name: normalized.name,
    indexes,
    selectedIndexId: indexes[Math.max(0, selectedPos)].id
  }
}
