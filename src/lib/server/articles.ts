import fs from "fs"
import path from "path"

import { siteConfig } from "@/config/site"

const ARTICLES_DIR = path.join(process.cwd(), "content", "articles")
const DEFAULT_THUMBNAIL = "/og-image.png"
const DEFAULT_CATEGORY = "General"

export interface ArticleHeading {
  id: string
  depth: number
  text: string
}

export interface ArticleMeta {
  slug: string
  title: string
  description: string
  date: string
  updated?: string
  author: string
  category: string
  tags: string[]
  thumbnail: string
  thumbnailAlt: string
  url: string
}

export interface Article extends ArticleMeta {
  content: string
  headings: ArticleHeading[]
  readingTime: string
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

const parseScalar = (value: string) => value.trim().replace(/^["']|["']$/g, "")

const parseTags = (value?: string) => {
  if (!value) return []
  const trimmed = value.trim()

  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    return trimmed.slice(1, -1).split(",").map(parseScalar).filter(Boolean)
  }

  return trimmed.split(",").map(parseScalar).filter(Boolean)
}

const parseFrontmatter = (raw: string) => {
  if (!raw.startsWith("---")) return { data: {}, content: raw }

  const end = raw.indexOf("\n---", 3)
  if (end === -1) return { data: {}, content: raw }

  const frontmatter = raw.slice(3, end).trim()
  const content = raw.slice(end + 4).trim()
  const data: Record<string, string> = {}

  frontmatter.split("\n").forEach((line) => {
    const separatorIndex = line.indexOf(":")
    if (separatorIndex === -1) return

    const key = line.slice(0, separatorIndex).trim()
    const value = line.slice(separatorIndex + 1).trim()
    data[key] = value
  })

  return { data, content }
}

const getHeadings = (content: string): ArticleHeading[] => {
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

const getReadingTime = (content: string) => {
  const words = stripMarkdown(content).split(/\s+/).filter(Boolean).length
  const minutes = Math.max(1, Math.ceil(words / 220))
  return `${minutes} min read`
}

const normaliseImage = (src?: string) => {
  return src ? parseScalar(src) : ""
}

const getArticleFromFile = (filename: string): Article => {
  const slug = filename.replace(/\.md$/, "")
  const raw = fs.readFileSync(path.join(ARTICLES_DIR, filename), "utf8")
  const { data, content } = parseFrontmatter(raw)
  const firstHeading = /^#\s+(.+)$/m.exec(content)?.[1]
  const title = parseScalar(data.title || firstHeading || slug)
  const description = parseScalar(
    data.description || "Read the latest NTUMods article."
  )
  const date = parseScalar(data.date || new Date().toISOString().slice(0, 10))
  const updated = data.updated ? parseScalar(data.updated) : undefined
  const author = parseScalar(data.author || siteConfig.name)
  const category = parseScalar(data.category || DEFAULT_CATEGORY)
  const thumbnail = normaliseImage(data.thumbnail)

  return {
    slug,
    title,
    description,
    date,
    updated,
    author,
    category,
    tags: parseTags(data.tags),
    thumbnail,
    thumbnailAlt: parseScalar(data.thumbnailAlt || title),
    url: `${siteConfig.url}/articles/${slug}`,
    content,
    headings: getHeadings(content),
    readingTime: getReadingTime(content)
  }
}

export const getAllArticles = () => {
  if (!fs.existsSync(ARTICLES_DIR)) return []

  return fs
    .readdirSync(ARTICLES_DIR)
    .filter((filename) => filename.endsWith(".md"))
    .filter((filename) => !filename.startsWith("_"))
    .map(getArticleFromFile)
    .sort((a, b) => Date.parse(b.date) - Date.parse(a.date))
}

export const getArticleBySlug = (slug: string) =>
  getAllArticles().find((article) => article.slug === slug)

export const getArticleCategories = () =>
  Array.from(new Set(getAllArticles().map((article) => article.category))).sort(
    (a, b) => a.localeCompare(b)
  )

export const slugifyCategory = (category: string) =>
  category
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

export const getArticlesByCategory = (categorySlug: string) =>
  getAllArticles().filter(
    (article) => slugifyCategory(article.category) === categorySlug
  )

export const getArticleImageUrl = (thumbnail: string) => {
  const src = thumbnail || DEFAULT_THUMBNAIL
  return src.startsWith("http")
    ? src
    : `${siteConfig.url}${src.startsWith("/") ? src : `/${src}`}`
}
