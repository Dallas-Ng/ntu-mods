import { POPULAR_ARTICLE_SLUGS } from "@/config/popular-articles"
import { getAllArticles, type Article } from "@/astro/lib/articles"

const fmt = (date: string) =>
  new Date(date).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric"
  })

const Meta = ({ a }: { a: Article }) => (
  <p className="text-foreground/75 text-sm">
    {a.category} · {fmt(a.date)} · {a.readingTime}
  </p>
)

// One lead guide at poster size, the next few as a reading list beside it.
const LandingArticles = async () => {
  const all = await getAllArticles()
  // Most read first (PostHog ranking), anything unranked after, newest first
  const rank = (slug: string) => {
    const i = (POPULAR_ARTICLE_SLUGS as readonly string[]).indexOf(slug)
    return i === -1 ? POPULAR_ARTICLE_SLUGS.length : i
  }
  const [lead, ...rest] = [...all]
    .sort((a, b) => rank(a.slug) - rank(b.slug))
    .slice(0, 4)

  if (!lead) return null

  return (
    <section className="mx-auto max-w-7xl px-4">
      <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <h2 className="landing-reveal max-w-2xl text-4xl leading-none font-bold tracking-tighter md:text-5xl">
          Guides for planning your semester
        </h2>
        <a
          href="/articles"
          className="text-primary text-lg font-semibold underline-offset-4 hover:underline">
          View all articles
        </a>
      </div>

      <div className="grid gap-3 lg:grid-cols-[7fr_5fr]">
        <a
          href={`/articles/${lead.slug}`}
          className="landing-reveal group bg-muted flex flex-col overflow-hidden rounded-2xl">
          <div className="relative flex flex-1 flex-col justify-center gap-3 p-5 md:p-6 lg:min-h-[300px]">
            <Meta a={lead} />
            <h3 className="line-clamp-2 text-2xl leading-tight font-bold tracking-tight md:text-3xl">
              {lead.title}
            </h3>
            <p className="text-foreground/80 line-clamp-3 text-lg">
              {lead.description}
            </p>
          </div>
        </a>

        <ul className="flex flex-col gap-3">
          {rest.map((a) => (
            <li key={a.slug} className="landing-reveal flex-1">
              <a
                href={`/articles/${a.slug}`}
                className="hover:bg-muted group flex h-full gap-4 rounded-2xl p-4 transition-colors duration-150">
                <div className="flex min-w-0 flex-col justify-center gap-1">
                  <Meta a={a} />
                  <h3 className="line-clamp-3 text-lg leading-snug font-semibold">
                    {a.title}
                  </h3>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default LandingArticles
