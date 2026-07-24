import type { APIRoute } from "astro"

import { getLlmsContent } from "@/lib/llms-content"

export const prerender = true

export const GET: APIRoute = () =>
  new Response(getLlmsContent(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  })
