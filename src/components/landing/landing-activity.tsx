import { CHANGELOG } from "@/config/changelog-data"

const CHANGES = CHANGELOG.reduce((sum, r) => sum + r.items.length, 0)

// One entry per date and title, in case the changelog repeats a release
const seen = new Set<string>()
const RECENT = CHANGELOG.filter((r) => {
  const key = `${r.date}|${r.title}`
  if (seen.has(key)) return false
  seen.add(key)
  return true
}).slice(0, 3)

// Proof the site is looked after, in plain words: how much has been added and
// what changed most recently. The heading already says when it started.
const LandingActivity = () => (
  <section className="mx-auto max-w-7xl px-4">
    <h2 className="landing-reveal max-w-3xl text-4xl leading-none font-bold tracking-tighter md:text-5xl">
      Built in 2023. Still improving.
    </h2>
    <p className="mt-4 max-w-2xl text-base md:text-lg">
      NTUMods is still looked after, with new features and fresh course data
      added over time.
    </p>

    <div className="mt-10 grid gap-3 xl:grid-cols-[5fr_7fr]">
      <div className="bg-muted landing-reveal flex flex-col justify-between gap-6 rounded-2xl p-6 md:p-7">
        <p className="text-6xl leading-none font-bold tracking-tighter md:text-7xl">
          {CHANGES}
        </p>
        <p className="text-xl font-semibold">New features and fixes so far</p>
      </div>

      <div className="bg-muted rounded-2xl p-5 md:p-7">
        <p className="text-xl font-semibold">What we added most recently</p>
        <ol className="mt-5">
          {RECENT.map((release) => {
            const kinds = [...new Set(release.items.map((i) => i.category))]
            return (
              <li
                key={`${release.date}|${release.title}`}
                className="landing-reveal flex gap-4">
                <div className="flex flex-col items-center">
                  <span className="bg-primary mt-2 size-3 shrink-0 rounded-full" />
                  <span className="bg-foreground/15 w-0.5 flex-1" />
                </div>
                <a
                  href="/changelog"
                  className="hover:bg-accent -mt-1 mb-2 flex-1 rounded-xl px-3 py-2 transition-colors duration-150">
                  <span className="block text-sm">{release.date}</span>
                  <span className="block text-lg font-semibold">
                    {release.title}
                  </span>
                  <span className="mt-1 flex flex-wrap gap-1.5">
                    {kinds.map((kind) => (
                      <span
                        key={kind}
                        className="bg-background rounded-full px-2.5 py-0.5 text-sm">
                        {kind}
                      </span>
                    ))}
                  </span>
                </a>
              </li>
            )
          })}
        </ol>
        <a
          href="/changelog"
          className="text-primary text-lg font-semibold underline-offset-4 hover:underline">
          See everything we have added
        </a>
      </div>
    </div>
  </section>
)

export default LandingActivity
