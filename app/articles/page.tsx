import Link from "next/link"

import { getAllArticles } from "@/lib/server/articles"

export const dynamic = "force-static"
export const revalidate = Infinity

export default function ArticlesPage() {
  const articles = getAllArticles()

  return (
    <div className="py-8">
      <div className="mb-8 max-w-3xl">
        <h1 className="text-3xl font-bold tracking-normal">Articles</h1>
        <p className="mt-2 text-foreground/80">
          Guides, updates, and notes from NTUMods.
        </p>
      </div>

      {articles.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {articles.map((article) => (
            <Link
              key={article.slug}
              href={`/articles/${article.slug}`}
              className="group rounded-md border bg-card transition-colors hover:bg-accent">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={article.thumbnail}
                alt={article.thumbnailAlt}
                className="aspect-[16/9] w-full rounded-t-md border-b object-cover"
              />
              <div className="p-4">
                <div className="text-xs text-foreground/70">
                  {new Date(article.date).toLocaleDateString("en-SG", {
                    day: "numeric",
                    month: "short",
                    year: "numeric"
                  })}{" "}
                  · {article.readingTime}
                </div>
                <h2 className="mt-2 line-clamp-2 font-semibold group-hover:text-primary">
                  {article.title}
                </h2>
                <p className="mt-2 line-clamp-3 text-sm leading-6 text-foreground/80">
                  {article.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-md border bg-card p-6 text-sm text-foreground/80">
          No articles published yet. Copy{" "}
          <code className="rounded bg-muted px-1 py-0.5">
            content/articles/_template.md
          </code>{" "}
          into the same folder without the leading underscore to publish one.
        </div>
      )}
    </div>
  )
}
