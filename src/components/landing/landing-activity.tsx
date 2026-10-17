import { CHANGELOG } from "@/config/changelog-data"
import { SITE_LIVE_SINCE } from "@/config/site-activity"
import { getSemesterCoverage } from "@/lib/server/db/repo"

const CHANGES = CHANGELOG.reduce((sum, r) => sum + r.items.length, 0)

// Proof the site is looked after, in plain words: how long it has been up,
// how much has been added, and what changed most recently.
const LandingActivity = async () => {
  const coverage = await getSemesterCoverage()

  const stats = [
    { value: SITE_LIVE_SINCE, label: "Online since" },
    { value: String(CHANGES), label: "New features and fixes" },
    {
      value: String(coverage.count),
      label: `Semesters of course data, back to ${coverage.earliestYear}`
    }
  ]

  return (
    <section className="mx-auto max-w-7xl px-4">
      <h2 className="landing-reveal max-w-3xl text-4xl leading-none font-bold tracking-tighter md:text-5xl">
        Built in 2023. Still improving.
      </h2>
      <p className="mt-4 max-w-2xl text-base md:text-lg">
        NTUMods has been online since {SITE_LIVE_SINCE} and is still looked
        after, with new features and fresh course data added over time.
      </p>

      <div className="mt-10 grid gap-3 xl:grid-cols-[5fr_7fr]">
        <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-muted landing-reveal flex flex-col justify-between gap-4 rounded-2xl p-6 xl:flex-1">
              <p className="text-4xl leading-none font-bold tracking-tight md:text-5xl">
                {s.value}
              </p>
              <p className="text-base md:text-lg">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-muted rounded-2xl p-5 md:p-7">
          <p className="text-xl font-semibold">What we added most recently</p>
          <ol className="mt-5">
            {CHANGELOG.slice(0, 6).map((release) => (
              <li key={release.id} className="landing-reveal flex gap-4">
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
                </a>
              </li>
            ))}
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
}

export default LandingActivity
