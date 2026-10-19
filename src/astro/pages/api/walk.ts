import type { APIRoute } from "astro"
import { waitUntil } from "cloudflare:workers"

import { rateLimit } from "@/lib/server/guard"
import { reverseWalk, type WalkResult } from "@/lib/venue-map"

export const prerender = false

// Walking route between two places on the NTU campus, via MazeMap's public
// routing service. Proxied (not called from the browser) so answers can be
// cached at the edge and a student's venues are not sent to a third party
// directly.
const UPSTREAM = "https://routing.mazemap.com/routing/path/"

/**
 * Routes only change when the map does, so they are kept at the edge with no
 * expiry. To purge them all, bump this when the venue data is rebuilt
 * (scraper/venues.py); old entries are never read again.
 */
const ROUTE_CACHE_VERSION = "1"

// The Workers edge cache; the DOM typings do not know `default`.
const edge = () => (caches as unknown as { default: Cache }).default

const json = (body: unknown, status = 200, headers?: HeadersInit) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers }
  })

/** "lon,lat,z" inside the campus box, or null. */
const point = (raw: string | null) => {
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

interface Feature {
  geometry: { coordinates: [number, number][] }
  properties: {
    m: number
    z: number
    timeEstimateSeconds: number
    flags: string[]
  }
}

export const GET: APIRoute = async ({ url, request }) => {
  const a = point(url.searchParams.get("a"))
  const b = point(url.searchParams.get("b"))
  if (!a || !b)
    return json({ error: "a and b must be lon,lat,z on campus" }, 400)

  // Round to ~1 m so near-identical requests share a cache entry. A to B and B
  // to A share one too: always ask and store in sorted order, and flip the
  // answer when the caller asked the other way round.
  const at = (p: typeof a) => `${p.lon.toFixed(5)},${p.lat.toFixed(5)},${p.z}`
  const flip = at(a) > at(b)
  const [s, t] = flip ? [b, a] : [a, b]
  const q = new URLSearchParams({
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
  // Browsers cannot be purged, so they keep it a day; the edge keeps it until
  // the version above changes.
  const headers = {
    "Cache-Control": "public, max-age=86400, s-maxage=31536000"
  }
  const reply = (r: WalkResult) => json(flip ? reverseWalk(r) : r, 200, headers)

  // Hits skip the rate limit and MazeMap.
  const cacheKey = new Request(
    `${url.origin}/api/walk?v=${ROUTE_CACHE_VERSION}&${q}`
  )
  const hit = await edge().match(cacheKey)
  if (hit) return reply(await hit.json())

  const limited = await rateLimit("WALK_LIMITER", request)
  if (limited) return limited

  let features: Feature[]
  try {
    const res = await fetch(`${UPSTREAM}?${q}`, {
      signal: AbortSignal.timeout(8000)
    })
    if (!res.ok) return json({ error: "upstream" }, 502)
    features = (await res.json()).path?.features ?? []
  } catch {
    return json({ error: "upstream" }, 502)
  }
  if (!features.length) return json({ error: "no route" }, 404)

  // Group consecutive path pieces by level; a change of level is a stairs/lift hop.
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

  waitUntil(edge().put(cacheKey, json(result, 200, headers)))
  return reply(result)
}
