import Link from "next/link"

import { getAllArticles } from "@/lib/server/articles"

const LandingArticles = () => {
  const articles = getAllArticles().slice(0, 3)

  if (!articles.length) return null

  return (
    <section>
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-4xl font-bold">Articles</h2>
          <p className="text-foreground/75">
            Guides for planning modules, choosing BDEs, and building a better
            NTU timetable.
          </p>
        </div>

        <Link
          href="/articles"
          className="text-sm font-medium text-primary underline-offset-4 hover:underline">
          View all articles
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {articles.map((article) => (
          <Link
            key={article.slug}
            href={`/articles/${article.slug}`}
            className="group rounded-lg border bg-card transition-colors hover:bg-accent">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={article.thumbnail}
              alt={article.thumbnailAlt}
              className="aspect-[16/9] w-full rounded-t-lg border-b object-cover"
            />

            <div className="p-4">
              <p className="text-xs text-foreground/65">
                {new Date(article.date).toLocaleDateString("en-SG", {
                  day: "numeric",
                  month: "short",
                  year: "numeric"
                })}{" "}
                · {article.readingTime}
              </p>

              <h3 className="mt-2 line-clamp-2 font-semibold group-hover:text-primary">
                {article.title}
              </h3>

              <p className="mt-2 line-clamp-3 text-sm leading-6 text-foreground/75">
                {article.description}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

export default LandingArticles
