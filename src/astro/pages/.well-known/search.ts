import type { APIRoute } from "astro"
import { env } from "cloudflare:workers"

import {
  AGENT_SEARCH_INDEX,
  type AgentSearchPage,
  type SearchPostings,
  searchShard,
  searchTerms
} from "@/lib/agent-search"
import { escapeMarkdown } from "@/lib/markdown/format"

function markdown(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "no-store",
      "Content-Signal": "search=yes, ai-input=yes, ai-train=no",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex",
      ...(status === 200 ? { "Accept-Query": "text/plain" } : {}),
      ...(status === 503 ? { "Retry-After": "60" } : {})
    }
  })
}

export const GET: APIRoute = async ({ url }) => {
  const query = url.searchParams.get("q")?.replace(/\s+/g, " ").trim() ?? ""
  if (!query || query.length > 200)
    return markdown(
      "Provide a search query of 1 to 200 characters in `q`.\n",
      400
    )

  const heading = `# Search results for: "${escapeMarkdown(query)}"\n\n`
  const terms = searchTerms(query).slice(0, 12)
  if (!terms.length) return markdown(heading + "No matching pages.\n")

  const readIndex = async <T>(file: string): Promise<T> => {
    const response = await env.ASSETS.fetch(
      new URL(`${AGENT_SEARCH_INDEX}/${file}.json`, url)
    )
    if (!response.ok) throw new Error("Search index unavailable")
    return response.json()
  }

  const shardIds = [...new Set(terms.map(searchShard))]
  const shards = new Map<number, SearchPostings>()
  try {
    await Promise.all(
      shardIds.map(async (id) =>
        shards.set(id, await readIndex<SearchPostings>(String(id)))
      )
    )
  } catch {
    return markdown("Search is temporarily unavailable.\n", 503)
  }

  const scores = new Map<number, number>()
  for (const term of terms) {
    const postings = shards.get(searchShard(term))
    if (!postings || !Object.hasOwn(postings, term)) continue
    for (const [page, weight] of postings[term])
      scores.set(page, (scores.get(page) ?? 0) + weight)
  }
  if (!scores.size) return markdown(heading + "No matching pages.\n")

  let pages: AgentSearchPage[]
  try {
    pages = await readIndex<AgentSearchPage[]>("pages")
  } catch {
    return markdown("Search is temporarily unavailable.\n", 503)
  }

  const entries = [...scores]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id]) => {
      const { title, url, description } = pages[id]
      const summary = description.replace(/\s+/g, " ").trim()
      return `## [${escapeMarkdown(title)}](<${url}>)\n\n${escapeMarkdown(summary)}`
    })
  return markdown(heading + entries.join("\n\n") + "\n")
}
