import type { APIRoute } from "astro"

import { getLlmsContent } from "@/lib/llms-content"
import { getSiteFacts } from "@/astro/lib/site-facts"

export const prerender = true

export const GET: APIRoute = async () =>
  new Response(getLlmsContent(await getSiteFacts()), {
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  })
