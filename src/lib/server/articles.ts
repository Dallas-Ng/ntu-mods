export interface ArticleHeading {
  id: string
  depth: number
  text: string
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")

const stripMarkdown = (value: string) =>
  value
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_~>#-]/g, "")
    .trim()

export const getHeadings = (content: string): ArticleHeading[] => {
  const seen = new Map<string, number>()

  return content
    .split("\n")
    .map((line) => {
      const match = /^(#{2,3})\s+(.+)$/.exec(line)
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
  const words = stripMarkdown(content).split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.ceil(words / 220))
  return `${minutes} min read`
}

export const slugifyCategory = (category: string) =>
  category
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

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
        .replace(/!\[[^\]]*\]\([^)]+\)/g, "")
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        .replace(/[`*_~>#]/g, "")
        .replace(/\s+/g, " ")
        .trim()
      if (answer) items.push({ question: currentQuestion, answer })
    }
    currentQuestion = null
    currentAnswerLines.length = 0
  }

  for (const line of lines) {
    const h2 = /^##\s+(.+)$/.exec(line)
    const h3 = /^###\s+(.+)$/.exec(line)

    if (h2) {
      if (inFaqSection) {
        pushCurrent()
        break
      }
      if (/frequently asked questions|^faq$/i.test(h2[1].trim())) {
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
