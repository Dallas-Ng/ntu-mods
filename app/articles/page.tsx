import { Suspense } from "react"
import type { Metadata } from "next"

import { siteConfig } from "@/config/site"
import { getAllArticles, getArticleCategories } from "@/lib/server/articles"
import ArticlesList from "@/components/articles/articles-list"

export const dynamic = "force-static"
export const revalidate = false
export const metadata: Metadata = {
  title: siteConfig.metatags.articles.title,
  description: siteConfig.metatags.articles.desc,
  alternates: { canonical: "/articles" }
}

export default function ArticlesPage() {
  const articles = getAllArticles()
  const categories = getArticleCategories()
  const articleList = articles.map(
    ({
      slug,
      title,
      description,
      date,
      category,
      tags,
      thumbnail,
      thumbnailAlt,
      readingTime
    }) => ({
      slug,
      title,
      description,
      date,
      category,
      tags,
      thumbnail,
      thumbnailAlt,
      readingTime
    })
  )

  return (
    <div className="py-6 sm:py-8">
      <div className="mb-6 max-w-3xl sm:mb-8">
        <h1 className="text-2xl font-bold tracking-normal sm:text-3xl">
          Articles
        </h1>
        <p className="text-foreground/80 mt-2">
          Guides, updates, and notes from NTUMods.
        </p>
      </div>

      <Suspense>
        <ArticlesList articles={articleList} categories={categories} />
      </Suspense>
    </div>
  )
}
