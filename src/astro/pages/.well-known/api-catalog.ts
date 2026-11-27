import type { APIRoute } from "astro"

import { siteConfig } from "@/config/site"

export const prerender = true

export const GET: APIRoute = () =>
  Response.json(
    {
      linkset: [
        {
          anchor: `${siteConfig.url}/.well-known/api-catalog`,
          item: [{ href: `${siteConfig.url}/developers/api` }]
        },
        {
          anchor: `${siteConfig.url}/developers/api`,
          "service-desc": [
            {
              href: `${siteConfig.url}/developers/openapi.json`,
              type: "application/json"
            }
          ],
          "service-doc": [
            { href: `${siteConfig.url}/developers/api`, type: "text/html" }
          ]
        }
      ]
    },
    { headers: { "Content-Type": "application/linkset+json" } }
  )
