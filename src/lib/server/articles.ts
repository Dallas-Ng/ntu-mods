export interface ArticleHeading {
  id: string
  depth: number
  text: string
}

const SLUG_CHARS = /[^a-z0-9\s-]/g // e.g. "hello!" -> "!"
const WHITESPACE = /\s+/g // e.g. "A  B" -> "  "
const HYPHENS = /-+/g // e.g. "a--b" -> "--"
const IMAGE_WITH_ALT = /!\[([^\]]*)\]\([^)]+\)/g // e.g. "![map](map.png)" -> "map"
const LINK_WITH_TEXT = /\[([^\]]+)\]\([^)]+\)/g // e.g. "[guide](/guide)" -> "guide"
const MARKDOWN = /[`*_~>#-]/g // e.g. "**bold**" -> "*"
const HEADING = /^(#{2,3})\s+(.+)$/ // e.g. "## Courses" -> "##", "Courses"
const WORD_SEPARATOR = /\s+/ // e.g. "one  two" -> "  "
const CATEGORY_CHARS = /[^a-z0-9]+/g // e.g. "study tips" -> " "
const EDGE_HYPHENS = /^-|-$/g // e.g. "-study-" -> leading and trailing "-"

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(SLUG_CHARS, "")
    .replace(WHITESPACE, "-")
    .replace(HYPHENS, "-")

const stripMarkdown = (value: string) =>
  value
    .replace(IMAGE_WITH_ALT, "$1")
    .replace(LINK_WITH_TEXT, "$1")
    .replace(MARKDOWN, "")
    .trim()

export const getHeadings = (content: string): ArticleHeading[] => {
  const seen = new Map<string, number>()

  return content
    .split("\n")
    .map((line) => {
      const match = HEADING.exec(line)
      if (!match) return null

      const text = stripMarkdown(match[2])
      const baseId = slugify(text)
      const count = seen.get(baseId) ?? 0
      seen.set(baseId, count + 1)

      return {
        id: count ? `${baseId}-${count + 1}` : baseId,
        depth: match[1].length,
        text
      }
    })
    .filter(Boolean) as ArticleHeading[]
}

export const getReadingTime = (content: string) => {
  const words = stripMarkdown(content)
    .split(WORD_SEPARATOR)
    .filter(Boolean).length
  const minutes = Math.max(1, Math.ceil(words / 220))
  return `${minutes} min read`
}

export const slugifyCategory = (category: string) =>
  category
    .trim()
    .toLowerCase()
    .replace(CATEGORY_CHARS, "-")
    .replace(EDGE_HYPHENS, "")
