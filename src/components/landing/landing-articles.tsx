import { getAllArticles } from "@/astro/lib/articles"

const LandingArticles = async () => {
  const articles = (await getAllArticles()).slice(0, 3)

  if (!articles.length) return null

  return (
    <section className="mx-auto max-w-7xl px-4">
      <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <h2 className="landing-reveal max-w-2xl text-4xl leading-none font-bold tracking-tighter md:text-6xl">
          Guides for planning your semester
        </h2>
        <a
          href="/articles"
          className="text-primary text-lg font-semibold underline-offset-4 hover:underline">
          View all articles
        </a>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {articles.map((article) => (
          <a
            key={article.slug}
            href={`/articles/${article.slug}`}
            className="landing-reveal group bg-muted hover:bg-accent overflow-hidden rounded-xl transition-colors">
            {article.thumbnail && (
              <img
                loading="lazy"
                decoding="async"
                src={article.thumbnail}
                alt={article.thumbnailAlt}
                className="aspect-video w-full object-cover"
              />
            )}

            <div className="p-5">
              <p className="text-foreground/75 text-sm">
                {new Date(article.date).toLocaleDateString("en-SG", {
                  day: "numeric",
                  month: "short",
                  year: "numeric"
                })}{" "}
                · {article.readingTime}
              </p>

              <h3 className="mt-2 line-clamp-2 text-xl font-semibold">
                {article.title}
              </h3>

              <p className="text-foreground/75 mt-2 line-clamp-3">
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
