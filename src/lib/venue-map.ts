// Types and helpers for the campus map (data from scraper/venues.py).

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

export const levelLabel = (data: VenueData, z: number) => {
  const n = levelName(data, z)
  return /^B\d/.test(n)
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

export const loadVenueData = () =>
  import("@/data/venues/venues.json").then(
    (m) => m.default as unknown as VenueData
  )

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

const walkCache = new Map<string, Promise<WalkResult | null>>()

export const fetchWalk = (a: Place, b: Place) => {
  const key = `${a.lon},${a.lat},${a.z}>${b.lon},${b.lat},${b.z}`
  let p = walkCache.get(key)
  if (!p) {
    p = fetch(`/api/walk?a=${a.lon},${a.lat},${a.z}&b=${b.lon},${b.lat},${b.z}`)
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

export interface Stop {
  id: string
  code: string
  type: string
  group: string
  day: number
  start: number
  end: number
  venueKey: string
  venue: MapVenue | null
}

const toMin = (hhmm: string) =>
  Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(2, 4))

export const fmtMin = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`

/** Classes on `day` (1 = Monday), earliest first. */
export const dayStops = (
  timetable: TimetableWithIndex,
  day: number,
  venues: VenueData["venues"]
): Stop[] => {
  const stops: Stop[] = []
  for (const [code, slots] of Object.entries(timetable))
    for (const s of slots) {
      if (s.day !== day) continue
      const [a, b] = s.time.split("-")
      const key = s.venue.trim()
      stops.push({
        id: `${code}:${s.key}:${s.type}:${s.time}`,
        code,
        type: s.type,
        group: s.group,
        day,
        start: toMin(a),
        end: toMin(b),
        venueKey: key,
        venue: venues[key] ?? null
      })
    }
  return stops.sort((x, y) => x.start - y.start)
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
