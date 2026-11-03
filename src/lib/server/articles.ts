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
const IMAGE = /!\[[^\]]*\]\([^)]+\)/g // e.g. "![map](map.png)"
const FAQ_MARKDOWN = /[`*_~>#]/g // e.g. "**answer**" -> "*"
const H2 = /^##\s+(.+)$/
const H3 = /^###\s+(.+)$/
const FAQ_HEADING = /frequently asked questions|^faq$/i // e.g. "Frequently Asked Questions" or "FAQ"

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

export const extractFaqItems = (
  content: string
): { question: string; answer: string }[] => {
  const lines = content.split("\n")
  const items: { question: string; answer: string }[] = []

  let inFaqSection = false
  let currentQuestion: string | null = null
  const currentAnswerLines: string[] = []

  const pushCurrent = () => {
    if (currentQuestion && currentAnswerLines.length > 0) {
      const answer = currentAnswerLines
        .join(" ")
        .replace(IMAGE, "")
        .replace(LINK_WITH_TEXT, "$1")
        .replace(FAQ_MARKDOWN, "")
        .replace(WHITESPACE, " ")
        .trim()
      if (answer) items.push({ question: currentQuestion, answer })
    }
    currentQuestion = null
    currentAnswerLines.length = 0
  }

  for (const line of lines) {
    const h2 = H2.exec(line)
    const h3 = H3.exec(line)

    if (h2) {
      if (inFaqSection) {
        pushCurrent()
        break
      }
      if (FAQ_HEADING.test(h2[1].trim())) {
        inFaqSection = true
      }
      continue
    }

    if (!inFaqSection) continue

    if (h3) {
      pushCurrent()
      currentQuestion = stripMarkdown(h3[1])
      continue
    }

    if (currentQuestion && line.trim() && !line.startsWith("#")) {
      currentAnswerLines.push(line.trim())
    }
  }

  if (inFaqSection) pushCurrent()

  return items
}
