import type { APIRoute } from "astro"

import { siteConfig } from "@/config/site"
import { WEBMCP_TOOLS } from "@/lib/webmcp/definitions"

export const prerender = true

/**
 * The tools the site registers through WebMCP, as data. Generated from the
 * same list the page registers, so the two cannot disagree.
 */
export const GET: APIRoute = () =>
  new Response(
    JSON.stringify(
      {
        name: siteConfig.name,
        url: siteConfig.url,
        api: "WebMCP: navigator.modelContext.registerTool (Chrome early preview)",
        note: "These tools exist only inside a browser tab on this site that supports WebMCP. They act on the visitor's own saved plans. This file is for discovery.",
        tools: WEBMCP_TOOLS.map((tool) => ({
          name: tool.name,
          title: tool.title,
          description: tool.description,
          inputSchema: tool.inputSchema,
          annotations: { readOnlyHint: tool.readOnly },
          ...("pathPrefix" in tool ? { pathPrefix: tool.pathPrefix } : {})
        }))
      },
      null,
      2
    ),
    { headers: { "Content-Type": "application/json; charset=utf-8" } }
  )
