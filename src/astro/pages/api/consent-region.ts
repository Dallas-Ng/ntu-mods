import type { APIRoute } from "astro"

import { consentRequiredFor } from "@/lib/consent-regions"

export const prerender = false

// Tells the banner whether the visitor's country requires analytics opt-in.
// Per-visitor, so it must never be cached.
export const GET: APIRoute = ({ request }) => {
  const cf = (request as { cf?: { country?: string; regionCode?: string } }).cf
  const country = request.headers.get("cf-ipcountry") ?? cf?.country
  const required = consentRequiredFor(country, cf?.regionCode)
  return new Response(JSON.stringify({ required }), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "private, no-store"
    }
  })
}
