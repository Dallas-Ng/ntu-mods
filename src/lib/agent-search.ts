import { siteConfig } from "@/config/site"

export const AGENT_SEARCH_PATH = "/.well-known/search"
export const AGENT_SEARCH_INDEX = "/_agent-search"
export const SEARCH_SHARDS = 64

export const agentSearch = {
  instructions:
    "Search NTUMods for modules, guides, tools and other public pages. Use keywords or a question. Results are returned in Markdown.",
  endpoint: `${siteConfig.url}${AGENT_SEARCH_PATH}?q={query}`,
  method: "GET",
  documentation:
    "https://developers.cloudflare.com/ai-search/how-to/search-for-agents/"
}

export interface AgentSearchPage {
  url: string
  title: string
  description: string
}

export type SearchPostings = Record<string, [page: number, weight: number][]>

export function searchShard(term: string) {
  let hash = 0
  for (let i = 0; i < term.length; i++) {
    hash = (hash * 31 + term.charCodeAt(i)) % SEARCH_SHARDS
  }
  return hash
}

const commonWords = new Set(
  "a an and are can do for how i in is it me my of on or the to what when where which with".split(
    " "
  )
)

export function searchTerms(text: string) {
  const words = text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []
  return [...new Set(words.filter((word) => !commonWords.has(word)))]
}
