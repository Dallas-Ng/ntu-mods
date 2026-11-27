import type { APIRoute } from "astro"

import { siteConfig } from "@/config/site"

export const prerender = true

export const GET: APIRoute = () =>
  Response.json(
    {
      $schema:
        "https://static.modelcontextprotocol.io/schemas/v1/server-card.schema.json",
      name: "com.ntumods/ntumods",
      title: siteConfig.name,
      version: "1.0.0",
      description:
        "Read-only access to NTU module records, class indexes and exam timetables. No sign-in required.",
      websiteUrl: siteConfig.url,
      remotes: [
        {
          type: "streamable-http",
          url: `${siteConfig.url}/mcp`
        }
      ]
    },
    { headers: { "Content-Type": "application/mcp-server-card+json" } }
  )
