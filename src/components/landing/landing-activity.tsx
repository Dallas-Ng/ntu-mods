import { CHANGELOG } from "@/config/changelog-data"

const CHANGES = CHANGELOG.reduce((sum, r) => sum + r.items.length, 0)

// One entry per date and title, in case the changelog repeats a release
const seen = new Set<string>()
const RELEASES = CHANGELOG.filter((r) => {
  const key = `${r.date}|${r.title}`
  if (seen.has(key)) return false
  seen.add(key)
  return true
})

const YEAR_MS = 365 * 24 * 60 * 60 * 1000
const LAST_12_MONTHS = RELEASES.filter(
  (r) => Date.now() - new Date(r.date).getTime() < YEAR_MS
).length

const RECENT = RELEASES.slice(0, 4)

// Proof the site is looked after: how often it changes, and the latest changes.
const LandingActivity = () => (
  <section className="mx-auto max-w-7xl px-4">
    <h2 className="landing-reveal max-w-3xl text-5xl leading-none font-bold tracking-tighter md:text-6xl">
      Built in 2023. Still improving.
    </h2>
    <p className="mt-4 max-w-2xl text-base md:text-lg">
      NTUMods is still looked after, with new features and fresh course data
      added over time.
    </p>

    <div className="mt-10 grid gap-3 xl:grid-cols-[4fr_8fr]">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-1">
        {[
          { value: LAST_12_MONTHS, label: "Updates in the last 12 months" },
          { value: CHANGES, label: "New features and fixes since launch" }
        ].map((s) => (
          <div
            key={s.label}
            className="bg-muted landing-reveal flex flex-col justify-between gap-4 rounded-2xl p-5 md:p-6 xl:flex-1">
            <p className="text-5xl leading-none font-bold tracking-tighter md:text-6xl">
              {s.value}
            </p>
            <p className="text-xl font-semibold">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-muted rounded-2xl p-3 md:p-4">
        <ol>
          {RECENT.map((release, i) => {
            const kinds = [...new Set(release.items.map((it) => it.category))]
            return (
              // Phones show three updates, wider screens four
              <li
                key={`${release.date}|${release.title}`}
                className={`flex gap-3 ${i >= 3 ? "hidden md:flex" : ""}`}>
                <div className="flex flex-col items-center">
                  <span className="bg-primary mt-[1.15rem] size-3 shrink-0 rounded-full" />
                  {i < RECENT.length - 1 && (
                    <span className="bg-foreground/15 mt-1 w-0.5 flex-1" />
                  )}
                </div>
                <a
                  href="/changelog"
                  className="hover:bg-accent mb-1 flex flex-1 flex-col gap-0.5 rounded-xl px-3 py-3 transition-colors duration-150 md:flex-row md:items-center md:gap-4">
                  <span className="text-sm md:w-28 md:shrink-0">
                    {release.date}
                    <span className="md:hidden"> · {kinds.join(", ")}</span>
                  </span>
                  <span className="flex-1 text-lg font-semibold">
                    {release.title}
                  </span>
                  <span className="hidden text-sm md:block md:text-right">
                    {kinds.join(", ")}
                  </span>
                </a>
              </li>
            )
          })}
        </ol>
        <a
          href="/changelog"
          className="text-primary mt-1 mb-1 ml-6 inline-block text-lg font-semibold underline-offset-4 hover:underline">
          See everything we have added
        </a>
      </div>
    </div>
  </section>
)

export default LandingActivity
