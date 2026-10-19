import type { APIRoute } from "astro"

import { ON_DEMAND_CACHE_CONTROL } from "@/lib/edge-cache"
import { getLatestModuleSnapshot } from "@/lib/server/edge/get-module-snapshot"
import { getKnownCodes } from "@/lib/server/edge/known-codes"
import { rateLimit } from "@/lib/server/guard"

export const prerender = false

const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*",
  // A JSON duplicate of /mods/CODE: keep it out of search results.
  "X-Robots-Tag": "noindex"
}

// Same shape the data layer accepts; rejecting the rest here costs no D1 query.
const CODE = /^[A-Z0-9]{2,12}$/

// A miss is one cheap D1 query, but every distinct code is a cache miss, so
// unknown codes are cached too.
const MISS_CACHE = "public, max-age=300, s-maxage=86400"

const reply = (body: unknown, status: number, extra: HeadersInit = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, ...extra }
  })

/**
 * One module as JSON: the record behind /mods/CODE. Read by the WebMCP
 * get_module tool and listed in ai-catalog.json. Read-only, no personal data.
 *
 * Public and built on by third parties, and a cold request costs about a dozen
 * D1 queries, so it is hardened: one canonical URL per module (uppercase code,
 * no query string) so the edge cache key cannot be varied to force misses, a
 * format check before any query, cached 404s, a per-IP limit on what does reach
 * the worker, and a 503 rather than an uncaught error if D1 fails.
 */
export const GET: APIRoute = async ({ params, url, request }) => {
  const raw = params.code ?? ""
  const code = raw.toUpperCase()

  // Before the cheap branches too, so a flood of unique junk URLs (each one a
  // cache miss that still costs a worker run) is counted. Cached responses
  // never reach here.
  const limited = await rateLimit("MODULE_API_LIMITER", request)
  if (limited) {
    // Without this a browser on another origin cannot read the 429.
    limited.headers.set("Access-Control-Allow-Origin", "*")
    return limited
  }

  if (!CODE.test(code)) {
    return reply({ error: "Invalid module code" }, 400, {
      "Cache-Control": MISS_CACHE
    })
  }

  if (url.search || raw !== code) {
    return new Response(null, {
      status: 308,
      headers: {
        Location: `/api/modules/${encodeURIComponent(code)}`,
        "Cache-Control": "public, max-age=86400",
        "Access-Control-Allow-Origin": "*"
      }
    })
  }

  // Made-up codes stop here without a D1 query, so D1 work is capped at one
  // lookup per real module (then cached), however fast someone guesses codes.
  const codes = await getKnownCodes(url)
  if (codes && !codes.has(code)) {
    return reply({ error: `No module ${code}` }, 404, {
      "Cache-Control": MISS_CACHE
    })
  }

  let snapshot
  try {
    snapshot = await getLatestModuleSnapshot(code)
  } catch (error) {
    console.error("[api/modules] snapshot failed", error)
    return reply({ error: "Temporarily unavailable" }, 503, {
      "Retry-After": "30",
      "Cache-Control": "no-store"
    })
  }

  if (!snapshot) {
    return reply({ error: `No module ${code}` }, 404, {
      "Cache-Control": MISS_CACHE
    })
  }

  const { moduleData, indexes, exam, year, semester, prereqNode } = snapshot

  return new Response(
    JSON.stringify({
      code: moduleData.code,
      title: moduleData.title,
      au: Number(moduleData.au),
      description: moduleData.description ?? null,
      gradeType: moduleData.gradeType ?? null,
      school: moduleData.faculty || null,
      categories: moduleData.categories ?? [],
      // Groups: every group must be met, and any module in a group meets it.
      prerequisites: moduleData.prerequisite ?? [],
      requires: prereqNode?.requires ?? [],
      requiredBy: prereqNode?.requiredBy ?? [],
      mutuallyExclusiveWith: moduleData.mutuallyExclusiveWith ?? [],
      restrictions: {
        notAvailableToProgramme: moduleData.notAvailableToProgramme ?? null,
        notAvailableToAllProgrammeWith:
          moduleData.notAvailableToAllProgrammeWith ?? null,
        notAvailableAsCore: moduleData.notAvailableAsCoreToProgramme ?? null,
        notAvailableAsPe: moduleData.notAvailableAsPeToProgramme ?? null,
        notAvailableAsBdeUe: moduleData.notAvailableAsBdeueToProgramme ?? null
      },
      latestOffering: {
        year,
        semester,
        isCurrentSemester: snapshot.isCurrentOffering,
        indexCount: Object.keys(indexes).length
      },
      otherSemesters: snapshot.otherSemesters,
      exam,
      url: `https://ntumods.com/mods/${moduleData.code}`
    }),
    { headers: { ...headers, "Cache-Control": ON_DEMAND_CACHE_CONTROL } }
  )
}
