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

        <a
          href="/articles"
          className="text-primary text-sm font-medium underline-offset-4 hover:underline">
          View all articles
        </a>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {articles.map((article) => (
          <a
            key={article.slug}
            href={`/articles/${article.slug}`}
            className="group bg-card hover:bg-accent rounded-lg border transition-colors">
            {article.thumbnail && (
              <img
                loading="lazy"
                decoding="async"
                src={article.thumbnail}
                alt={article.thumbnailAlt}
                className="aspect-video w-full rounded-t-lg border-b object-cover"
              />
            )}

            <div className="p-4">
              <p className="text-foreground/65 text-xs">
                {new Date(article.date).toLocaleDateString("en-SG", {
                  day: "numeric",
                  month: "short",
                  year: "numeric"
                })}{" "}
                · {article.readingTime}
              </p>

              <h3 className="group-hover:text-primary mt-2 line-clamp-2 font-semibold transition-colors">
                {article.title}
              </h3>

              <p className="text-foreground/75 mt-2 line-clamp-3 text-sm leading-6">
                {article.description}
              </p>
            </div>
          </a>
        ))}
      </div>
    </section>
  )
}

export default LandingArticles
