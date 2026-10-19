import type { WalkResult } from "@/lib/venue-map"

/**
 * MazeMap's pedestrian router, and how its answer becomes a WalkResult. Shared
 * by /api/walk and scripts/db/seed-walks.mts so a seeded route is exactly what
 * the endpoint would have computed.
 */
export const UPSTREAM = "https://routing.mazemap.com/routing/path/"

/**
 * Routes only change when the map does. To purge them, bump this when the
 * venue data is rebuilt (scraper/venues.py) and run `DELETE FROM walks`; stale
 * rows and edge entries are never read again.
 */
export const ROUTE_CACHE_VERSION = "1"

export interface RoutePoint {
  lon: number
  lat: number
  z: number
}

/** "lon,lat,z" inside the campus box, or null. */
export const parsePoint = (raw: string | null): RoutePoint | null => {
  const [lon, lat, z] = (raw ?? "").split(",").map(Number)
  const ok =
    lon > 103.67 &&
    lon < 103.7 &&
    lat > 1.33 &&
    lat < 1.36 &&
    z >= -8 &&
    z <= 15
  return ok ? { lon, lat, z: Math.round(z) } : null
}

/** A point rounded to ~1 m, so near-identical requests share an entry. */
export const pointKey = (p: RoutePoint) =>
  `${p.lon.toFixed(5)},${p.lat.toFixed(5)},${p.z}`

/** A to B and B to A share one entry: always ask and store in sorted order. */
export const sortPair = (a: RoutePoint, b: RoutePoint) => {
  const flip = pointKey(a) > pointKey(b)
  const [s, t] = flip ? [b, a] : [a, b]
  return { s, t, flip, key: `${pointKey(s)}>${pointKey(t)}` }
}

export const upstreamQuery = (s: RoutePoint, t: RoutePoint) =>
  new URLSearchParams({
    srid: "4326",
    hc: "false",
    lang: "en",
    distanceunitstype: "metric",
    mode: "PEDESTRIAN",
    sourcelon: s.lon.toFixed(5),
    sourcelat: s.lat.toFixed(5),
    sourcez: String(s.z),
    targetlon: t.lon.toFixed(5),
    targetlat: t.lat.toFixed(5),
    targetz: String(t.z)
  })

export interface Feature {
  geometry: { coordinates: [number, number][] }
  properties: {
    m: number
    z: number
    timeEstimateSeconds: number
    flags: string[]
  }
}

/** Group consecutive path pieces by level; a change of level is a stairs/lift hop. */
export const buildWalk = (features: Feature[]): WalkResult => {
  const result: WalkResult = {
    metres: 0,
    seconds: 0,
    segments: [],
    changes: []
  }
  for (const f of features) {
    const { z, m, timeEstimateSeconds, flags } = f.properties
    const pts = f.geometry.coordinates
    result.metres += m
    result.seconds += timeEstimateSeconds
    const last = result.segments.at(-1)
    if (last && last.z === z) {
      last.pts.push(
        ...pts
          .slice(1)
          .flat()
          .map((c) => +c.toFixed(6))
      )
      continue
    }
    if (last) {
      const [lon, lat] = pts[0]
      result.changes.push({
        lon,
        lat,
        from: last.z,
        to: z,
        stairs: flags.includes("STAIR")
      })
    }
    result.segments.push({ z, pts: pts.flat().map((c) => +c.toFixed(6)) })
  }
  result.metres = Math.round(result.metres)
  result.seconds = Math.round(result.seconds)
  return result
}
