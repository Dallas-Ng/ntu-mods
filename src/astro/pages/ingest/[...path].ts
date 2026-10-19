import type { APIRoute } from "astro"

import { bodyTooLarge } from "@/lib/server/guard"

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

// Headers that describe *this* origin rather than the upstream request, and
// must not be forwarded verbatim to PostHog.
const STRIPPED_REQUEST_HEADERS = ["host", "cookie", "cf-connecting-ip"]
// Upstream must not be able to set cookies on the ntumods.com origin through
// the proxy.
const STRIPPED_RESPONSE_HEADERS = ["set-cookie"]

// PostHog batches (and session recordings) are the only legitimate bodies.
const MAX_BODY_BYTES = 5_000_000

const handler: APIRoute = async ({ params, request }) => {
  if (bodyTooLarge(request, MAX_BODY_BYTES)) {
    return new Response("Request too large", { status: 413 })
  }
  const path = params.path ?? ""
  const url = new URL(request.url)
  const target = targetFor(path) + url.search

  const headers = new Headers(request.headers)
  for (const name of STRIPPED_REQUEST_HEADERS) headers.delete(name)

  const proxied = await fetch(target, {
    method: request.method,
    headers,
    body:
      request.method === "GET" || request.method === "HEAD"
        ? undefined
        : await request.arrayBuffer()
  })

  const responseHeaders = new Headers(proxied.headers)
  for (const name of STRIPPED_RESPONSE_HEADERS) responseHeaders.delete(name)

  return new Response(proxied.body, {
    status: proxied.status,
    headers: responseHeaders
  })
}

export const GET = handler
export const POST = handler
export const HEAD = handler
export const OPTIONS = handler
