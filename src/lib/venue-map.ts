// Types and helpers for the campus map (data from scraper/venues.py).
import { formatRemarks } from "./format"
import {
  ALL_TEACHING_WEEKS,
  parseTeachingWeeks,
  weeksOverlap
} from "./teaching-weeks"

export type LandmarkCat =
  | "hall"
  | "food"
  | "transport"
  | "study"
  | "sports"
  | "exam"
  | "services"
  | "parking"
  | "toilet"
  | "aed"

export interface MapBuilding {
  id: number
  name: string
  short: string
  rings: number[][]
  levels: number[]
  slots: number
  indoor: boolean
  hall: boolean
}

export interface MapVenue {
  poi: number
  code: string | null
  name: string
  b: number | null
  z: number
  floor: string | null
  lon: number
  lat: number
  x: number
  y: number
  how: "fbs" | "exact" | "override" | "fuzzy"
  slots: number
}

export interface Landmark {
  id: number | string
  c: LandmarkCat
  n: string
  b: number | null
  z: number
  x: number
  y: number
}

export interface VenueData {
  size: { width: number; height: number }
  origin: { lon0: number; lat1: number; mPerLon: number; mPerLat: number }
  levels: { z: number; name: string }[]
  buildings: MapBuilding[]
  venues: Record<string, MapVenue>
  landmarks: Landmark[]
}

export interface Room {
  i: number
  r: number[][]
  n?: string
  c?: string
  t?: string
  v?: string
}

export interface BuildingFloor {
  name: string
  outline: number[][]
  rooms: Room[]
  halls: number[][][]
  stairs: number[][][]
  lifts: number[][][]
}

export interface BuildingChunk {
  id: number
  floors: Record<string, BuildingFloor>
}

export interface WalkResult {
  metres: number
  seconds: number
  /** One piece of the path per level; `pts` is flat [lon,lat,lon,lat,...]. */
  segments: { z: number; pts: number[] }[]
  /** Stairs/lift hops between consecutive segments. */
  changes: {
    lon: number
    lat: number
    from: number
    to: number
    stairs: boolean
  }[]
}

export interface Place {
  lon: number
  lat: number
  z: number
}

export const CATEGORIES: Record<
  LandmarkCat,
  { label: string; defaultOn: boolean }
> = {
  hall: { label: "Halls", defaultOn: true },
  food: { label: "Food", defaultOn: true },
  transport: { label: "Bus and MRT", defaultOn: true },
  study: { label: "Study spaces", defaultOn: true },
  sports: { label: "Sports", defaultOn: false },
  exam: { label: "Exam halls", defaultOn: false },
  services: { label: "Shops and ATMs", defaultOn: false },
  parking: { label: "Car parks", defaultOn: false },
  toilet: { label: "Toilets", defaultOn: false },
  aed: { label: "AED points", defaultOn: false }
}

// --- geometry -----------------------------------------------------------

export const project = (
  origin: VenueData["origin"],
  lon: number,
  lat: number
): [number, number] => [
  (lon - origin.lon0) * origin.mPerLon,
  (origin.lat1 - lat) * origin.mPerLat
]

/** Flat [x,y,x,y,...] rings to one SVG path (use fill-rule evenodd for holes). */
export const ringsPath = (rings: number[][]) =>
  rings
    .map((r) => {
      let d = ""
      for (let i = 0; i < r.length; i += 2)
        d += `${i ? "L" : "M"}${r[i]} ${r[i + 1]}`
      return d + "Z"
    })
    .join("")

/** Bounding box of flat rings: [minX, minY, maxX, maxY]. */
export const ringsBounds = (
  rings: number[][]
): [number, number, number, number] => {
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity
  for (const r of rings)
    for (let i = 0; i < r.length; i += 2) {
      x0 = Math.min(x0, r[i])
      x1 = Math.max(x1, r[i])
      y0 = Math.min(y0, r[i + 1])
      y1 = Math.max(y1, r[i + 1])
    }
  return [x0, y0, x1, y1]
}

export const ringsCentre = (rings: number[][]): [number, number] => {
  const [x0, y0, x1, y1] = ringsBounds(rings)
  return [(x0 + x1) / 2, (y0 + y1) / 2]
}

export const levelName = (data: VenueData, z: number) =>
  z === 0 ? "Ground" : (data.levels.find((l) => l.z === z)?.name ?? String(z))

/** Compact form for buttons and chips: L4, B2, G. */
export const levelShort = (data: VenueData, z: number) => {
  const n = levelName(data, z)
  return z === 0 ? "G" : /^B\d/.test(n) ? n : `L${n}`
}

const BASEMENT_LEVEL = /^B\d/ // e.g. "B2"

export const levelLabel = (data: VenueData, z: number) => {
  const n = levelName(data, z)
  return BASEMENT_LEVEL.test(n)
    ? `Basement ${n.slice(1)}`
    : z === 0
      ? "Ground"
      : `Level ${n}`
}

// --- lazy data ----------------------------------------------------------

const chunkLoaders = import.meta.glob<{ default: BuildingChunk }>(
  "../data/venues/buildings/*.json"
)
const chunkCache = new Map<number, Promise<BuildingChunk | null>>()

let venueDataPromise: Promise<VenueData> | null = null

/** One shared load, so it can start before the page has finished hydrating. */
export const loadVenueData = () =>
  (venueDataPromise ??= import("@/data/venues/venues.json").then(
    (m) => m.default as unknown as VenueData
  ))

export const loadChunk = (id: number) => {
  let p = chunkCache.get(id)
  if (!p) {
    const load = chunkLoaders[`../data/venues/buildings/${id}.json`]
    p = load ? load().then((m) => m.default) : Promise.resolve(null)
    chunkCache.set(id, p)
  }
  return p
}

// --- walking ------------------------------------------------------------

/** The same walk the other way round: same time and distance, path reversed. */
export const reverseWalk = (w: WalkResult): WalkResult => ({
  ...w,
  segments: w.segments
    .map((s) => {
      const pts: number[] = []
      for (let i = s.pts.length - 2; i >= 0; i -= 2)
        pts.push(s.pts[i], s.pts[i + 1])
      return { z: s.z, pts }
    })
    .reverse(),
  changes: w.changes.map((c) => ({ ...c, from: c.to, to: c.from })).reverse()
})

const walkCache = new Map<string, Promise<WalkResult | null>>()
const walkKey = (p: Place) => `${p.lon},${p.lat},${p.z}`

export const fetchWalk = (a: Place, b: Place) => {
  const key = `${walkKey(a)}>${walkKey(b)}`
  const back = walkCache.get(`${walkKey(b)}>${walkKey(a)}`)
  let p = walkCache.get(key)
  if (!p) {
    p = back
      ? back.then((w) => w && reverseWalk(w))
      : fetch(`/api/walk?a=${walkKey(a)}&b=${walkKey(b)}`)
          .then((r) => (r.ok ? (r.json() as Promise<WalkResult>) : null))
          .catch(() => null)
    walkCache.set(key, p)
  }
  return p
}

/** Straight-line stand-in when the route service is unreachable. */
export const estimateWalk = (
  a: Place & { x: number; y: number },
  b: Place & { x: number; y: number }
): WalkResult => {
  const metres =
    Math.round(Math.hypot(a.x - b.x, a.y - b.y) * 1.35) +
    Math.abs(a.z - b.z) * 12
  return {
    metres,
    seconds: Math.round(metres / 1.1),
    segments: [{ z: a.z, pts: [a.lon, a.lat, b.lon, b.lat] }],
    changes: []
  }
}

// --- the student's day -----------------------------------------------------

export interface StopVenueNote {
  venueKey: string
  remarks: string
}

export interface Stop {
  id: string
  /** Module code, or the name of a custom block. */
  code: string
  /** Index type, used for colour. */
  type: string
  /** Type as the student sees it (a custom block's own session label). */
  typeLabel: string
  custom: boolean
  group: string
  day: number
  start: number
  end: number
  venueKey: string
  venue: MapVenue | null
  /** Remarks of the primary slot (e.g. "Teaching Wk1-9,11-13"). */
  remarks: string
  /** Teaching weeks (1-13) this stop runs on across all folded variations. */
  weeks: number[]
  /** Teaching weeks this stop is held at a physical (non-online) venue. */
  physicalWeeks: number[]
  /**
   * Alternate venues when the same class moves rooms or goes online on some
   * weeks.
   */
  otherVenues: StopVenueNote[]
}

const toMin = (hhmm: string) =>
  Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(2, 4))

export const fmtMin = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`

const isNonPhysicalVenue = (venueKey: string) => {
  const upper = venueKey.toUpperCase()
  return upper === "" || upper === "ONLINE"
}

/**
 * Format alternate venues for a folded stop, e.g. "online Wk10" or "LT28,
 * LKC-LT Wk7 · online Wk10".
 */
export const formatOtherVenues = (
  otherVenues: StopVenueNote[],
  primaryRemarks: string
): string[] => {
  if (!otherVenues.length) return []

  const physicalByRemarks = new Map<string, string[]>()
  const onlineRemarks: string[] = []

  for (const { venueKey, remarks } of otherVenues) {
    if (!venueKey) continue
    if (venueKey.toUpperCase() === "ONLINE") {
      if (!onlineRemarks.includes(remarks)) onlineRemarks.push(remarks)
      continue
    }
    const list = physicalByRemarks.get(remarks) ?? []
    if (!list.includes(venueKey)) list.push(venueKey)
    physicalByRemarks.set(remarks, list)
  }

  const parts: string[] = []
  for (const [remarks, keys] of physicalByRemarks) {
    const wk = remarks === primaryRemarks ? "" : formatRemarks(remarks).trim()
    const rooms = keys.length > 2 ? `+${keys.length} rooms` : keys.join(", ")
    parts.push(wk ? `${rooms} ${wk}` : rooms)
  }
  for (const remarks of onlineRemarks) {
    const wk = formatRemarks(remarks).trim()
    parts.push(wk ? `online ${wk}` : "online")
  }
  return parts
}

/**
 * Classes on `day` (1 = Monday), earliest first.
 *
 * NTU often lists the same class multiple times for the same day and time when
 * it moves online on e-Learning week (e.g. "ONLINE" in Wk10 alongside a room in
 * Wk1-9,11-13) or changes rooms on specific weeks. Fold those variations into
 * one stop anchored to its primary physical venue so they do not appear as
 * self-clashes or break walking legs between neighbouring classes.
 */
export const dayStops = (
  timetable: TimetableWithIndex,
  day: number,
  venues: VenueData["venues"]
): Stop[] => {
  type Group = { code: string; slots: Index[] }
  const groups = new Map<string, Group>()
  let customSeq = 0

  for (const [code, slots] of Object.entries(timetable))
    for (const s of slots) {
      if (s.day !== day || !s.time || !s.time.includes("-")) continue
      const groupKey = s.isCustom
        ? `custom|${code}|${s.key}|${s.time}|${customSeq++}`
        : `${code}|${s.key}|${s.type}|${s.group}|${s.time}`
      const existing = groups.get(groupKey)
      if (existing) existing.slots.push(s)
      else groups.set(groupKey, { code, slots: [s] })
    }

  const stops: Stop[] = []
  for (const { code, slots } of groups.values()) {
    const candidates = slots.map((s) => {
      const venueKey = s.venue.trim()
      const weeks = s.isCustom
        ? [...ALL_TEACHING_WEEKS]
        : parseTeachingWeeks(s.remarks)
      return {
        slot: s,
        venueKey,
        venue: venues[venueKey] ?? null,
        weeks,
        physical: !isNonPhysicalVenue(venueKey)
      }
    })

    // Prefer a physical venue over ONLINE/empty, then the venue with the most
    // weeks, then one that resolves on the map.
    const primary = candidates.reduce((best, cur) => {
      if (cur.physical !== best.physical) return cur.physical ? cur : best
      if (cur.weeks.length !== best.weeks.length)
        return cur.weeks.length > best.weeks.length ? cur : best
      if (Boolean(cur.venue) !== Boolean(best.venue))
        return cur.venue ? cur : best
      return best
    })

    const allWeeks = new Set<number>()
    const physicalWeeks = new Set<number>()
    const otherVenues: StopVenueNote[] = []
    const seenOther = new Set<string>()

    for (const c of candidates) {
      for (const w of c.weeks) {
        allWeeks.add(w)
        if (c.physical) physicalWeeks.add(w)
      }
      if (c.venueKey && c.venueKey !== primary.venueKey) {
        const noteKey = `${c.venueKey}|${c.slot.remarks}`
        if (!seenOther.has(noteKey)) {
          seenOther.add(noteKey)
          otherVenues.push({ venueKey: c.venueKey, remarks: c.slot.remarks })
        }
      }
    }

    const s = primary.slot
    const [a, b] = s.time.split("-")
    stops.push({
      id: `${code}:${s.key}:${s.type}:${s.day}:${s.time}:${stops.length}`,
      code: s.isCustom ? s.group : code,
      type: s.type,
      typeLabel: s.isCustom ? s.remarks : s.type,
      custom: Boolean(s.isCustom),
      group: s.group,
      day,
      start: toMin(a),
      end: toMin(b),
      venueKey: primary.venueKey,
      venue: primary.venue,
      remarks: s.isCustom ? "" : s.remarks,
      weeks: [...allWeeks].sort((x, y) => x - y),
      physicalWeeks: [...physicalWeeks].sort((x, y) => x - y),
      otherVenues
    })
  }

  return stops.sort((x, y) => x.start - y.start)
}

/**
 * Classes that overlap in time on at least one shared teaching week (stops are
 * sorted by start), with who they overlap with. Back-to-back (end == start) or
 * disjoint weeks (e.g. odd vs even weeks) are not clashes.
 */
export const findStopClashes = (stops: Stop[]) => {
  const withCodes = new Map<string, string[]>()
  let pairs = 0
  stops.forEach((b, i) => {
    for (let j = 0; j < i; j++) {
      const a = stops[j]
      if (a.end <= b.start) continue
      if (!weeksOverlap(a.weeks, b.weeks)) continue
      pairs++
      withCodes.set(a.id, [
        ...(withCodes.get(a.id) ?? []),
        `${b.code} ${b.typeLabel}`.trim()
      ])
      withCodes.set(b.id, [
        ...(withCodes.get(b.id) ?? []),
        `${a.code} ${a.typeLabel}`.trim()
      ])
    }
  })
  return { withCodes, pairs }
}

export type LegStatus = "ok" | "close" | "tight"

/** Slack between the walk and the gap before the next class. */
export const legStatus = (gapMin: number, walkMin: number): LegStatus => {
  const slack = gapMin - walkMin
  return slack < 0 ? "tight" : slack < 5 ? "close" : "ok"
}

export const legColour: Record<LegStatus, string> = {
  ok: "hsl(var(--primary))",
  close: "hsl(var(--index-sem-border))",
  tight: "hsl(var(--destructive))"
}

/** Words that should find a category's places, beyond their own names. */
export const CATEGORY_ALIASES: Record<LandmarkCat, string> = {
  hall: "hall hostel dorm dormitory residence",
  food: "food canteen eat drink coffee cafe",
  transport: "bus stop mrt station shuttle",
  study: "library study lounge",
  sports: "sports gym fitness recreation exercise",
  exam: "exam examination hall",
  services: "shop atm bank clinic service",
  parking: "car park carpark parking drive",
  toilet: "toilet restroom washroom",
  aed: "aed defibrillator emergency"
}

// --- flat terrain (OpenStreetMap greens, water and roads) ---

export interface Terrain {
  green: number[][]
  pitch: number[][]
  water: number[][]
  streams: number[][]
  roads: { major: number[][]; minor: number[][]; path: number[][] }
}

export const loadTerrain = () =>
  import("@/data/venues/terrain.json").then(
    (m) => m.default as unknown as Terrain
  )

/** Flat [x,y,x,y,...] lines to one open SVG path. */
export const linesPath = (lines: number[][]) =>
  lines
    .map((l) => {
      let d = ""
      for (let i = 0; i < l.length; i += 2)
        d += `${i ? "L" : "M"}${l[i]} ${l[i + 1]}`
      return d
    })
    .join("")

/** Building fill over satellite imagery (Hybrid view). */
export type HybridTone = "grey" | "darkgrey" | "blue" | "darkblue"

export const HYBRID_TONES: {
  key: HybridTone
  label: string
  swatch: string
}[] = [
  { key: "grey", label: "Grey", swatch: "#6b7280" },
  { key: "darkgrey", label: "Dark grey", swatch: "#1f2937" },
  { key: "blue", label: "Blue", swatch: "#0a1f5c" },
  { key: "darkblue", label: "Dark blue", swatch: "#050d2e" }
]
