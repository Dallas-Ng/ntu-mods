import type { APIRoute } from "astro"

import { ON_DEMAND_CACHE_CONTROL } from "@/lib/edge-cache"
import { MARKDOWN_FOOTER } from "@/lib/markdown-footer"
import {
  markdownFrontmatter,
  type MarkdownMetadata
} from "@/lib/markdown/metadata"
import { renderModuleMarkdown } from "@/lib/markdown/module"
import { getModuleUrl, getModuleVersionUrl } from "@/lib/module-url"
import {
  getLatestModuleSnapshot,
  getModuleSnapshot
} from "@/lib/server/edge/get-module-snapshot"

function markdownResponse(
  metadata: MarkdownMetadata,
  markdown: string,
  status = 200
) {
  return new Response(
    `${markdownFrontmatter(metadata)}\n\n${markdown.trimEnd()}\n\n---\n\n${MARKDOWN_FOOTER}\n`,
    {
      status,
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Cache-Control": status === 200 ? ON_DEMAND_CACHE_CONTROL : "no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Signal": "search=yes, ai-input=yes, ai-train=no",
        "X-Robots-Tag": "noindex"
      }
    }
  )
}

export const getModuleMarkdown: APIRoute = async ({ params, url, site }) => {
  const code = params.module?.toUpperCase() ?? ""
  const { year, semester } = params
  const latest = year ? null : await getLatestModuleSnapshot(code)
  const snapshot =
    year && semester ? await getModuleSnapshot(code, year, semester) : latest
  const offeringYear = year ?? latest?.year
  const offeringSemester = semester ?? latest?.semester
  const origin = site ?? url.origin
  if (!snapshot || !offeringYear || !offeringSemester)
    return markdownResponse(
      {
        title: "Module not found",
        description: "The requested NTU module offering could not be found.",
        url: new URL(url.pathname.slice(0, -3), origin).href
      },
      "# Module not found",
      404
    )

  const { moduleData } = snapshot
  const canonicalPath =
    year && !("canonicalToLatest" in snapshot && snapshot.canonicalToLatest)
      ? getModuleVersionUrl(code, offeringYear, offeringSemester)
      : getModuleUrl(code)

  return markdownResponse(
    {
      title: `${code} ${moduleData.title}`,
      description:
        moduleData.description ??
        `Module details and class indexes for ${code}.`,
      url: new URL(canonicalPath, origin).href
    },
    renderModuleMarkdown({
      ...snapshot,
      year: offeringYear,
      semester: offeringSemester,
      otherSemesters: latest?.otherSemesters,
      origin
    })
  )
}
