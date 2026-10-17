import type { APIRoute } from "astro"

import { getLatestSemester } from "@/lib/server/db/repo"
import { getLandingDemoData } from "@/components/landing/landing-demo-data"

export const prerender = true

// The landing page's student timetables. Kept out of the page HTML (they are
// below the fold) and fetched when the section scrolls into view.
export const GET: APIRoute = async () => {
  const { year, semester } = await getLatestSemester()
  return new Response(
    JSON.stringify(await getLandingDemoData(year, semester)),
    {
      headers: { "Content-Type": "application/json; charset=utf-8" }
    }
  )
}
