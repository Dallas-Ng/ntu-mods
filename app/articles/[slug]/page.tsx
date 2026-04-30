import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import Script from "next/script"
import { jsonLdScriptProps } from "react-schemaorg"
import type { Article as ArticleJsonLd, WithContext } from "schema-dts"

import {
  getAllArticles,
  getArticleBySlug,
  getArticleImageUrl
} from "@/lib/server/articles"
import ArticleMarkdown from "@/components/articles/article-markdown"
import ArticleToc from "@/components/articles/article-toc"
import Breadcrumbs from "@/components/breadcrumbs"

export const dynamic = "force-static"
export const dynamicParams = true
export const revalidate = Infinity

export default function ArticlePage({ params }: { params: { slug: string } }) {
  const article = getArticleBySlug(params.slug)
  if (!article) notFound()

  const moreArticles = getAllArticles()
    .filter((item) => item.slug !== article.slug)
    .slice(0, 3)

  return (
    <div className="min-w-0 py-4 sm:py-6">
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

      <Script
        id="article-jsonld"
        type="application/ld+json"
        strategy="beforeInteractive"
        {...jsonLdScriptProps<WithContext<ArticleJsonLd>>({
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
        })}
      />

      <div className="mt-5 grid min-w-0 justify-center gap-8 lg:grid-cols-[minmax(0,48rem)_16rem]">
        <article className="max-w-full min-w-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.thumbnail}
            alt={article.thumbnailAlt}
            className="mb-5 aspect-[16/9] w-full rounded-md border object-cover sm:mb-6"
          />

          <div className="mb-6 border-b pb-4 text-sm text-foreground/70 sm:mb-8 sm:pb-5">
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
                className="rounded-md border bg-card p-3 transition-colors hover:bg-accent">
                <p className="line-clamp-2 text-sm font-medium break-words">
                  {item.title}
                </p>
                <p className="mt-2 text-xs text-foreground/70">
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

export function generateStaticParams() {
  return getAllArticles().map((article) => ({ slug: article.slug }))
}

export function generateMetadata({
  params
}: {
  params: { slug: string }
}): Metadata | null {
  const article = getArticleBySlug(params.slug)
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
