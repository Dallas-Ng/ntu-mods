import { Suspense } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import type {
  Article as ArticleJsonLd,
  BreadcrumbList,
  WithContext
} from "schema-dts"

import { siteConfig } from "@/config/site"
import {
  getAllArticles,
  getArticleBySlug,
  getArticleCategories,
  getArticleImageUrl,
  getArticlesByCategory,
  slugifyCategory
} from "@/lib/server/articles"
import ArticleMarkdown from "@/components/articles/article-markdown"
import ArticleToc from "@/components/articles/article-toc"
import ArticleViewTracker from "@/components/articles/article-view-tracker"
import ArticlesList from "@/components/articles/articles-list"
import Breadcrumbs from "@/components/breadcrumbs"

export const dynamic = "force-static"
export const dynamicParams = true
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

export function generateStaticParams() {
  const articleParams = getAllArticles().map((article) => ({
    slug: article.slug
  }))
  const categoryParams = getArticleCategories().map((category) => ({
    slug: slugifyCategory(category)
  }))
  return [...articleParams, ...categoryParams]
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>
}): Promise<Metadata | null> {
  const params = await props.params
  const { slug } = params

  // Category page
  const categoryArticles = getArticlesByCategory(slug)
  if (categoryArticles.length) {
    const meta = CATEGORY_META[slug]
    const categoryName = categoryArticles[0].category
    return {
      title: meta?.title ?? `NTU ${categoryName} Articles | NTUMods`,
      description:
        meta?.desc ?? `NTUMods guides on ${categoryName} for NTU students.`,
      alternates: { canonical: `/articles/${slug}` }
    }
  }

  // Article page
  const article = getArticleBySlug(slug)
  if (!article) return null

  const image = getArticleImageUrl(article.thumbnail)

  return {
    title: article.title,
    description: article.description,
    keywords: article.tags,
    authors: [{ name: article.author }],
    alternates: {
      canonical: `/articles/${article.slug}`
    },
    openGraph: {
      type: "article",
      url: article.url,
      title: article.title,
      description: article.description,
      publishedTime: article.date,
      modifiedTime: article.updated || article.date,
      authors: [article.author],
      tags: article.tags,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: article.thumbnailAlt
        }
      ]
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
      images: [image]
    }
  }
}

export default async function ArticleOrCategoryPage(props: {
  params: Promise<{ slug: string }>
}) {
  const params = await props.params
  const { slug } = params

  // Category page
  const categoryArticles = getArticlesByCategory(slug)
  if (categoryArticles.length) {
    const meta = CATEGORY_META[slug]
    const categoryName = categoryArticles[0].category
    const heading = meta?.heading ?? `${categoryName} Articles`
    const subheading = meta?.subheading ?? `NTUMods guides on ${categoryName}.`

    const articleList = categoryArticles.map(
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

  // Article page
  const article = getArticleBySlug(slug)
  if (!article) notFound()

  const moreArticles = getAllArticles()
    .filter((item) => item.slug !== article.slug)
    .slice(0, 3)

  const jsonLd: WithContext<ArticleJsonLd> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    image: getArticleImageUrl(article.thumbnail),
    datePublished: article.date,
    dateModified: article.updated || article.date,
    author: {
      "@type": "Person",
      name: article.author
    },
    mainEntityOfPage: article.url
  }

  const breadcrumbJsonLd: WithContext<BreadcrumbList> = {
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
        name: article.title,
        item: article.url
      }
    ]
  }

  return (
    <div className="min-w-0 py-4 sm:py-6">
      <ArticleViewTracker slug={slug} />
      <Breadcrumbs
        breadcrumbs={[
          { href: "/", label: "Home", name: "Home" },
          { href: "/articles", label: "Articles", name: "Articles" },
          {
            href: `/articles/${article.slug}`,
            label: article.title,
            name: article.title
          }
        ]}
      />

      <script
        id="article-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        id="article-breadcrumb-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="mt-5 grid min-w-0 justify-center gap-8 lg:grid-cols-[minmax(0,48rem)_16rem]">
        <article className="max-w-full min-w-0">
          {article.thumbnail && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.thumbnail}
              alt={article.thumbnailAlt}
              className="mb-5 aspect-video w-full rounded-md border object-cover sm:mb-6"
            />
          )}

          <div className="text-foreground/70 mb-6 border-b pb-4 text-sm sm:mb-8 sm:pb-5">
            {new Date(article.date).toLocaleDateString("en-SG", {
              day: "numeric",
              month: "long",
              year: "numeric"
            })}{" "}
            · {article.readingTime} · {article.author}
          </div>

          <ArticleMarkdown
            content={article.content}
            headings={article.headings}
          />
        </article>

        <ArticleToc headings={article.headings} />
      </div>

      {moreArticles.length > 0 && (
        <section className="mx-auto mt-10 max-w-3xl border-t pt-6 sm:mt-12 sm:pt-8">
          <h2 className="text-xl font-semibold tracking-normal">
            More articles
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {moreArticles.map((item) => (
              <Link
                key={item.slug}
                href={`/articles/${item.slug}`}
                className="bg-card hover:bg-accent rounded-md border p-3 transition-colors">
                <p className="line-clamp-2 text-sm font-medium break-words">
                  {item.title}
                </p>
                <p className="text-foreground/70 mt-2 text-xs">
                  {item.readingTime}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
