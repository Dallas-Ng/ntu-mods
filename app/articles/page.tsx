import { Suspense } from "react"
import type { Metadata } from "next"

import { siteConfig } from "@/config/site"
import { getAllArticles, getArticleCategories } from "@/lib/server/articles"
import ArticlesList from "@/components/articles/articles-list"
import Header from "@/components/header"

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
    <div className="relative space-y-3">
      <Header
        title="Articles"
        subtitle="Guides, updates, and notes from NTUMods."
      />

      <Suspense>
        <ArticlesList articles={articleList} categories={categories} />
      </Suspense>
    </div>
  )
}
