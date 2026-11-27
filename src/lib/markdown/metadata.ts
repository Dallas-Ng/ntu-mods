import { agentSearch } from "@/lib/agent-search"

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
    ...Object.entries(agentSearch).map(
      ([key, value]) => `  ${key}: ${quote(value)}`
    ),
    `title: ${quote(title)}`,
    `description: ${quote(description)}`,
    `url: ${quote(url)}`,
    `last_updated: ${quote(date)}`,
    "---"
  ].join("\n")
}
