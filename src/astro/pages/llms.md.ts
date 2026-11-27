import type { APIRoute } from "astro"

import { getLlmsContent } from "@/lib/llms-content"
import { siteConfig } from "@/config/site"
import { MARKDOWN_FOOTER } from "@/lib/markdown-footer"
import { markdownFrontmatter } from "@/lib/markdown/metadata"
import { getSiteFacts } from "@/astro/lib/site-facts"

export const prerender = true

export const GET: APIRoute = async () =>
  new Response(
    `${markdownFrontmatter({
      title: "NTUMods",
      description: siteConfig.metatags.default.desc,
      url: `${siteConfig.url}/llms.md`
    })}\n\n${getLlmsContent(await getSiteFacts()).trimEnd()}\n\n---\n\n${MARKDOWN_FOOTER}\n`,
    {
      headers: { "Content-Type": "text/markdown; charset=utf-8" }
    }
  )
