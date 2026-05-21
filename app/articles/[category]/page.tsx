import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { siteConfig } from "@/config/site"
import {
  getArticleCategories,
  getArticlesByCategory,
  slugifyCategory
} from "@/lib/server/articles"
import ArticlesList from "@/components/articles/articles-list"

export const dynamic = "force-static"
export const revalidate = false

const CATEGORY_META: Record<
  string,
  { title: string; desc: string; heading: string; subheading: string }
> = {
  bde: {
    title: "NTU BDE Guides | NTUMods",
    desc: "Guides on choosing, bidding for, and planning NTU Broadening and Deepening Electives. Find easy BDEs, compare options, and plan around your timetable.",
    heading: "NTU BDE Guides",
    subheading: "Guides on choosing and planning your NTU electives."
  },
  stars: {
    title: "NTU STARS Guides | NTUMods",
    desc: "Guides on NTU STARS course registration: when to bid, how to plan indexes, add/drop strategies, and preparing your backup modules.",
    heading: "NTU STARS Guides",
    subheading: "Guides on STARS bidding and course registration."
  },
  "common-core": {
    title: "NTU Common Core Module Guides | NTUMods",
    desc: "Guides on NTU Common Core modules — what CC0001–CC0007 are like, how to plan your CC requirements, and what to expect from each category.",
    heading: "NTU Common Core Guides",
    subheading: "Guides on NTU Common Core modules and requirements."
  },
  "module-planning": {
    title: "NTU Module Planning Guides | NTUMods",
    desc: "Guides on planning NTU modules: balancing AUs and workload, checking prerequisites, avoiding clashes, and preparing for STARS registration.",
    heading: "NTU Module Planning Guides",
    subheading: "Guides on planning your NTU modules and timetable."
  }
}

export async function generateStaticParams() {
  const categories = getArticleCategories()
  return categories.map((category) => ({ category: slugifyCategory(category) }))
}

export async function generateMetadata(props: {
  params: Promise<{ category: string }>
}): Promise<Metadata | null> {
  const params = await props.params
  const slug = params.category
  const articles = getArticlesByCategory(slug)
  if (!articles.length) return null

  const meta = CATEGORY_META[slug]
  const categoryName = articles[0].category

  return {
    title: meta?.title ?? `NTU ${categoryName} Articles | NTUMods`,
    description:
      meta?.desc ??
      `NTUMods guides on ${categoryName} for NTU students.`,
    alternates: { canonical: `/articles/${slug}` }
  }
}

export default async function ArticleCategoryPage(props: {
  params: Promise<{ category: string }>
}) {
  const params = await props.params
  const slug = params.category
  const articles = getArticlesByCategory(slug)
  if (!articles.length) notFound()

  const meta = CATEGORY_META[slug]
  const categoryName = articles[0].category
  const heading = meta?.heading ?? `${categoryName} Articles`
  const subheading =
    meta?.subheading ?? `NTUMods guides on ${categoryName}.`

  const articleList = articles.map(
    ({
      slug: articleSlug,
      title,
      description,
      date,
      category,
      tags,
      thumbnail,
      thumbnailAlt,
      readingTime
    }) => ({
      slug: articleSlug,
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

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Articles",
        item: `${siteConfig.url}/articles`
      },
      {
        "@type": "ListItem",
        position: 2,
        name: heading,
        item: `${siteConfig.url}/articles/${slug}`
      }
    ]
  }

  return (
    <div className="py-6 sm:py-8">
      <div className="mb-6 max-w-3xl sm:mb-8">
        <h1 className="text-2xl font-bold tracking-normal sm:text-3xl">
          {heading}
        </h1>
        <p className="text-foreground/80 mt-2">{subheading}</p>
      </div>

      <Suspense>
        <ArticlesList articles={articleList} categories={[]} />
      </Suspense>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </div>
  )
}
