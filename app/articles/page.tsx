import type { Metadata } from "next"
import Link from "next/link"

import { siteConfig } from "@/config/site"
import { getAllArticles } from "@/lib/server/articles"

export const dynamic = "force-static"
export const revalidate = false
export const metadata: Metadata = {
  title: siteConfig.metatags.articles.title,
  description: siteConfig.metatags.articles.desc,
  alternates: { canonical: "/articles" }
}

export default function ArticlesPage() {
  const articles = getAllArticles()

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

      {articles.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`/articles/${article.slug}`}
              className="group bg-card hover:bg-accent rounded-md border transition-colors">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={article.thumbnail}
                alt={article.thumbnailAlt}
                className="aspect-[16/9] w-full rounded-t-md border-b object-cover"
              />
              <div className="p-4">
                <div className="text-foreground/70 text-xs">
                  {new Date(article.date).toLocaleDateString("en-SG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                  })}{" "}
                  · {article.readingTime}
                </div>
                <h2 className="group-hover:text-primary mt-2 line-clamp-2 font-semibold break-words">
                  {article.title}
                </h2>
                <p className="text-foreground/80 mt-2 line-clamp-3 text-sm leading-6 break-words">
                  {article.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-card text-foreground/80 rounded-md border p-4 text-sm break-words sm:p-6">
          No articles published yet. Copy{" "}
          <code className="bg-muted rounded px-1 py-0.5">
            content/articles/_template.md
          </code>{" "}
          into the same folder without the leading underscore to publish one.
        </div>
      )}
    </div>
  )
}
