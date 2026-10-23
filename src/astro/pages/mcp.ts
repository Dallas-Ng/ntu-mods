import type { APIRoute } from "astro"
import { env, waitUntil } from "cloudflare:workers"

import { ON_DEMAND_CACHE_CONTROL } from "@/lib/edge-cache"
import {
  getLatestModuleSnapshot,
  getModuleSnapshot
} from "@/lib/server/edge/get-module-snapshot"
import { getKnownCodes } from "@/lib/server/edge/known-codes"
import { createMcpEndpoint } from "@/lib/server/mcp/endpoint"
import { createMcpHandlers } from "@/lib/server/mcp/handlers"

export const prerender = false

// The ASSETS binding is fetched with the origin the request came in on: the
// dev server refuses any other host. Set per request; it is the same host for
// every request an isolate serves, so interleaved requests cannot disagree.
let origin = new URL("https://ntumods.com")

// Built once per isolate so the memoised data files survive between requests.
const endpoint = createMcpEndpoint(
  createMcpHandlers({
    async loadAsset(path) {
      const res = await env.ASSETS.fetch(new URL(path, origin))
      if (res.status === 404) return null
      if (!res.ok) throw new Error(`${path} ${res.status}`)
      return res.json()
    },
    getKnownCodes: () => getKnownCodes(origin),
    getLatestModuleSnapshot,
    getModuleSnapshot: (code, year, semester) =>
      getModuleSnapshot(new URL("http://internal/"), code, year, semester),
    cache: {
      async get(key) {
        const hit = await caches.default.match(key)
        return hit ? hit.json() : undefined
      },
      async put(key, value) {
        waitUntil(
          caches.default.put(
            key,
            new Response(JSON.stringify(value), {
              headers: { "Cache-Control": ON_DEMAND_CACHE_CONTROL }
            })
          )
        )
      }
    }
  })
)

// ALL, so GET and DELETE reach the endpoint and get a proper 405.
export const ALL: APIRoute = ({ request, url }) => {
  origin = new URL(url.origin)
  return endpoint(request)
}
