import { getCollection, type CollectionEntry } from "astro:content"

import { siteConfig } from "@/config/site"
import {
  getHeadings,
  getReadingTime,
  slugifyCategory
} from "@/lib/server/articles"

export type { ArticleHeading } from "@/lib/server/articles"
export { slugifyCategory }

export interface Article {
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
  thumbnailText: string
  url: string
  content: string
  headings: { id: string; depth: number; text: string }[]
  readingTime: string
  entry: CollectionEntry<"articles">
}

const toArticle = (entry: CollectionEntry<"articles">): Article => {
  const { data, body = "", id } = entry
  return {
    slug: id,
    title: data.title,
    description: data.description,
    date: data.date,
    updated: data.updated,
    author: data.author,
    category: data.category,
    tags: data.tags,
    thumbnail: data.thumbnail,
    thumbnailAlt: data.thumbnailAlt || data.title,
    thumbnailText: data.thumbnailText,
    url: `${siteConfig.url}/articles/${id}`,
    content: body,
    headings: getHeadings(body),
    readingTime: getReadingTime(body),
    entry
  }
}

export const getAllArticles = async (): Promise<Article[]> => {
  const entries = await getCollection("articles")
  return entries
    .map(toArticle)
    .sort((a: Article, b: Article) => Date.parse(b.date) - Date.parse(a.date))
}

export const getArticleBySlug = async (slug: string) => {
  const articles = await getAllArticles()
  return articles.find((article) => article.slug === slug)
}

export const getArticleCategories = async () => {
  const articles = await getAllArticles()
  return Array.from(new Set(articles.map((article) => article.category))).sort(
    (a, b) => a.localeCompare(b)
  )
}

export const getArticlesByCategory = async (categorySlug: string) => {
  const articles = await getAllArticles()
  return articles.filter(
    (article) => slugifyCategory(article.category) === categorySlug
  )
}

export const getArticleImageUrl = (thumbnail: string) => {
  const DEFAULT_THUMBNAIL = "/og-image.png"
  const src = thumbnail || DEFAULT_THUMBNAIL
  return src.startsWith("http")
    ? src
    : `${siteConfig.url}${src.startsWith("/") ? src : `/${src}`}`
}
