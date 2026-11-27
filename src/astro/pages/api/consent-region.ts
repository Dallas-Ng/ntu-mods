import type { APIRoute } from "astro"

import { defaultsToAnalytics } from "@/lib/consent-region"

export const prerender = false

// Tells the browser whether the visitor is in Singapore, where analytics run
// by default. Per-visitor, so only the visitor's own browser may keep it (a
// shared edge copy would hand one country's answer to another).
export const GET: APIRoute = ({ request }) => {
  const cf = (request as { cf?: { country?: string } }).cf
  const country = request.headers.get("cf-ipcountry") ?? cf?.country
  return new Response(
    JSON.stringify({ defaultOn: defaultsToAnalytics(country) }),
    {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "private, max-age=43200"
      }
    }
  )
}
