import { siteConfig } from "@/config/site"

export function markdownPath(path: string) {
  return path === "/" ? "/index.md" : `${path}.md`
}

export interface MarkdownMetadata {
  title: string
  description: string
  url: string
  lastUpdated?: string
}

export function markdownFrontmatter({
  title,
  description,
  url,
  lastUpdated
}: MarkdownMetadata) {
  // JSON-quoted strings are valid YAML and keep scraped text from creating keys.
  const quote = JSON.stringify
  const date =
    lastUpdated && !Number.isNaN(Date.parse(lastUpdated))
      ? new Date(lastUpdated).toISOString().slice(0, 10)
      : null
  return [
    "---",
    "agent:",
    `  instructions: ${quote("For NTU module searches, call the search_modules tool on the read-only NTUMods MCP server. Use llms.txt to find page-level Markdown.")}`,
    `  endpoint: ${quote(`${siteConfig.url}/mcp`)}`,
    '  method: "POST"',
    '  protocol: "MCP"',
    '  tool: "search_modules"',
    `  documentation: ${quote(`${siteConfig.url}/developers/mcp.md`)}`,
    `title: ${quote(title)}`,
    `description: ${quote(description)}`,
    `url: ${quote(url)}`,
    `last_updated: ${quote(date)}`,
    "---"
  ].join("\n")
}
