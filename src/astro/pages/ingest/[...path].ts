import type { APIRoute } from "astro"

// PostHog reverse-proxy — replaces the Vercel-only rewrite rules previously
// in vercel.json. Cloudflare Pages' declarative _redirects can only "proxy"
// (200 status) to relative paths, not external domains, so this runs as a
// real Worker request instead. Runs at request time via fetch() only — no
// fs, so it's safe under Cloudflare's workerd runtime.
export const prerender = false

function targetFor(path: string): string {
  if (path.startsWith("static/")) {
    return `https://us-assets.i.posthog.com/${path}`
  }
  if (path.startsWith("array/")) {
    return `https://us-assets.i.posthog.com/${path}`
  }
  return `https://us.i.posthog.com/${path}`
}

const handler: APIRoute = async ({ params, request }) => {
  const path = params.path ?? ""
  const url = new URL(request.url)
  const target = targetFor(path) + url.search

  const proxied = await fetch(target, {
    method: request.method,
    headers: request.headers,
    body:
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : await request.arrayBuffer()
  })

  return new Response(proxied.body, {
    status: proxied.status,
    headers: proxied.headers
  })
}

export const GET = handler
export const POST = handler
