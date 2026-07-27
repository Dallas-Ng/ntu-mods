/**
 * Encoding for sharing a timetable outside the app.
 *
 * Two carriers, one payload shape:
 *  - a link, where custom blocks ride along in the reserved `cb` query param
 *  - a text bundle (`NTUMODS1-…`), for when the link would get unwieldy
 *
 * Everything is packed as positional tuples before base64url-ing so the string
 * stays short enough to survive being pasted around.
 */

export const CUSTOM_BLOCKS_PARAM = "cb"

/** Query params on /share that are not module codes. */
export const RESERVED_SHARE_PARAMS = new Set([CUSTOM_BLOCKS_PARAM])

export const TEXT_BUNDLE_PREFIX = "NTUMODS1-"

// Guard rails so a hostile or corrupt payload can't blow up the app
const MAX_COURSES = 30
const MAX_INDEXES_PER_COURSE = 10
const MAX_SESSIONS_PER_INDEX = 30
const MAX_MODULES = 100
const MAX_NAME_LENGTH = 40
const MAX_LABEL_LENGTH = 30
const MAX_TYPE_LENGTH = 20
const MAX_VENUE_LENGTH = 60

type EncodedSession = [
  type: string,
  day: number,
  startTime: number,
  endTime: number,
  venue: string
]
type EncodedIndex = [label: string, sessions: EncodedSession[]]
type EncodedCourse = [
  name: string,
  indexes: EncodedIndex[],
  selectedIndex: number
]

interface TextBundle {
  v: 1
  t: Timetable
  c: EncodedCourse[]
}

// ─── base64url ───────────────────────────────────────────────────────────────

const toBase64Url = (input: string): string => {
  const bytes = new TextEncoder().encode(input)
  let binary = ""
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

const fromBase64Url = (input: string): string => {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/")
  const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(padded)
  const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

// ─── custom blocks ───────────────────────────────────────────────────────────

const encodeCourses = (courses: CustomCourse[]): EncodedCourse[] =>
  courses.slice(0, MAX_COURSES).map((course) => {
    const indexes = (course.indexes ?? []).slice(0, MAX_INDEXES_PER_COURSE)
    const selectedIndex = Math.max(
      0,
      indexes.findIndex((i) => i.id === course.selectedIndexId)
    )
    return [
      course.name,
      indexes.map<EncodedIndex>((courseIndex) => [
        courseIndex.label,
        courseIndex.sessions
          .slice(0, MAX_SESSIONS_PER_INDEX)
          .map<EncodedSession>((s) => [
            s.type,
            s.day,
            s.startTime,
            s.endTime,
            s.venue ?? ""
          ])
      ]),
      selectedIndex
    ]
  })

const str = (value: unknown, maxLength: number): string =>
  typeof value === "string" ? value.slice(0, maxLength) : ""

const num = (value: unknown, fallback: number): number =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback

const decodeCourses = (raw: unknown): CustomCourse[] => {
  if (!Array.isArray(raw)) return []

  const courses: CustomCourse[] = []

  for (const entry of raw.slice(0, MAX_COURSES)) {
    if (!Array.isArray(entry)) continue
    const [name, rawIndexes, rawSelected] = entry as EncodedCourse

    const indexes: CustomCourseIndex[] = []
    for (const rawIndex of (Array.isArray(rawIndexes) ? rawIndexes : []).slice(
      0,
      MAX_INDEXES_PER_COURSE
    )) {
      if (!Array.isArray(rawIndex)) continue
      const [label, rawSessions] = rawIndex as EncodedIndex

      const sessions: CustomCourseSession[] = []
      for (const rawSession of (Array.isArray(rawSessions)
        ? rawSessions
        : []
      ).slice(0, MAX_SESSIONS_PER_INDEX)) {
        if (!Array.isArray(rawSession)) continue
        const [type, day, startTime, endTime, venue] =
          rawSession as EncodedSession

        const parsedType = str(type, MAX_TYPE_LENGTH).trim()
        const parsedDay = num(day, 0)
        const parsedStart = num(startTime, 0)
        const parsedEnd = num(endTime, 0)

        if (!parsedType) continue
        if (parsedDay < 1 || parsedDay > 7) continue
        if (parsedEnd <= parsedStart) continue
        if (parsedStart < 0 || parsedEnd > 2400) continue

        sessions.push({
          type: parsedType,
          day: parsedDay,
          startTime: parsedStart,
          endTime: parsedEnd,
          venue: str(venue, MAX_VENUE_LENGTH)
        })
      }

      if (sessions.length === 0) continue

      indexes.push({
        id: crypto.randomUUID(),
        label: str(label, MAX_LABEL_LENGTH) || `Option ${indexes.length + 1}`,
        sessions
      })
    }

    const parsedName = str(name, MAX_NAME_LENGTH).trim()
    if (!parsedName || indexes.length === 0) continue

    const selectedPos = num(rawSelected, 0)
    courses.push({
      id: crypto.randomUUID(),
      name: parsedName,
      indexes,
      selectedIndexId:
        indexes[
          selectedPos >= 0 && selectedPos < indexes.length ? selectedPos : 0
        ].id
    })
  }

  return courses
}

export const encodeCustomBlocksParam = (courses: CustomCourse[]): string =>
  toBase64Url(JSON.stringify(encodeCourses(courses)))

export const decodeCustomBlocksParam = (
  value: string | null | undefined
): CustomCourse[] => {
  if (!value) return []
  try {
    return decodeCourses(JSON.parse(fromBase64Url(value)))
  } catch {
    return []
  }
}

// ─── share link ──────────────────────────────────────────────────────────────

export const buildShareLink = (
  baseUrl: string,
  timetable: Timetable,
  customCourses: CustomCourse[]
): string => {
  const params = new URLSearchParams(timetable)
  if (customCourses.length > 0) {
    params.set(CUSTOM_BLOCKS_PARAM, encodeCustomBlocksParam(customCourses))
  }
  return `${baseUrl}/share?${params.toString()}`
}

// ─── text bundle ─────────────────────────────────────────────────────────────

const decodeTimetable = (raw: unknown): Timetable => {
  if (!raw || typeof raw !== "object") return {}
  const timetable: Timetable = {}
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (Object.keys(timetable).length >= MAX_MODULES) break
    if (typeof value !== "string") continue
    if (!/^[A-Z0-9]{2,12}$/.test(key)) continue
    timetable[key] = value.slice(0, 20)
  }
  return timetable
}

export const encodeTextBundle = (
  timetable: Timetable,
  customCourses: CustomCourse[]
): string => {
  const bundle: TextBundle = {
    v: 1,
    t: timetable,
    c: encodeCourses(customCourses)
  }
  return `${TEXT_BUNDLE_PREFIX}${toBase64Url(JSON.stringify(bundle))}`
}

export interface DecodedBundle {
  timetable: Timetable
  customCourses: CustomCourse[]
}

/**
 * Accepts either a text bundle or a pasted /share link, so users don't have to
 * care which one they were handed.
 */
export const decodeTextBundle = (input: string): DecodedBundle | undefined => {
  const trimmed = input.trim()
  if (!trimmed) return undefined

  if (trimmed.includes("/share?") || trimmed.startsWith("?")) {
    try {
      const query = trimmed.slice(trimmed.indexOf("?") + 1)
      const params = new URLSearchParams(query)
      const customCourses = decodeCustomBlocksParam(
        params.get(CUSTOM_BLOCKS_PARAM)
      )
      const raw: Record<string, string> = {}
      for (const [key, value] of params.entries()) {
        if (RESERVED_SHARE_PARAMS.has(key)) continue
        raw[key] = value
      }
      const timetable = decodeTimetable(raw)
      if (Object.keys(timetable).length === 0 && customCourses.length === 0) {
        return undefined
      }
      return { timetable, customCourses }
    } catch {
      return undefined
    }
  }

  const payload = trimmed.startsWith(TEXT_BUNDLE_PREFIX)
    ? trimmed.slice(TEXT_BUNDLE_PREFIX.length)
    : undefined
  if (!payload) return undefined

  try {
    const parsed = JSON.parse(fromBase64Url(payload)) as TextBundle
    if (!parsed || parsed.v !== 1) return undefined
    return {
      timetable: decodeTimetable(parsed.t),
      customCourses: decodeCourses(parsed.c)
    }
  } catch {
    return undefined
  }
}
