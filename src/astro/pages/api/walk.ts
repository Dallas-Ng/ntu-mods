import type { APIRoute } from "astro"
import { env, waitUntil } from "cloudflare:workers"

import { rateLimit } from "@/lib/server/guard"
import { reverseWalk, type WalkResult } from "@/lib/venue-map"
import {
  buildWalk,
  parsePoint,
  ROUTE_CACHE_VERSION,
  sortPair,
  UPSTREAM,
  upstreamQuery,
  type Feature
} from "@/lib/walk-route"

export const prerender = false

// Walking route between two places on the NTU campus, via MazeMap's public
// routing service. Proxied (not called from the browser) so answers can be
// cached at the edge and a student's venues are not sent to a third party
// directly.

// The Workers edge cache; the DOM typings do not know `default`.
const edge = () => (caches as unknown as { default: Cache }).default

const json = (body: unknown, status = 200, headers?: HeadersInit) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers }
  })

export const GET: APIRoute = async ({ url, request }) => {
  const a = parsePoint(url.searchParams.get("a"))
  const b = parsePoint(url.searchParams.get("b"))
  if (!a || !b)
    return json({ error: "a and b must be lon,lat,z on campus" }, 400)

  // A to B and B to A share one entry; flip the answer when asked the other way.
  const { s, t, flip, key } = sortPair(a, b)
  const q = upstreamQuery(s, t)
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

  // Then the permanent copy: it outlives edge eviction and is shared by every
  // Cloudflare location. A missing table or binding just means no copy.
  const saved = await env.DB?.prepare(
    "SELECT route FROM walks WHERE key = ?1 AND v = ?2"
  )
    .bind(key, ROUTE_CACHE_VERSION)
    .first<{ route: string }>()
    .catch(() => null)
  if (saved) {
    const route = JSON.parse(saved.route) as WalkResult
    waitUntil(edge().put(cacheKey, json(route, 200, headers)))
    return reply(route)
  }

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

  const result = buildWalk(features)

  waitUntil(edge().put(cacheKey, json(result, 200, headers)))
  if (env.DB)
    waitUntil(
      env.DB.prepare(
        "INSERT OR REPLACE INTO walks (key, v, route) VALUES (?1, ?2, ?3)"
      )
        .bind(key, ROUTE_CACHE_VERSION, JSON.stringify(result))
        .all()
        .catch(() => null)
    )
  return reply(result)
}
