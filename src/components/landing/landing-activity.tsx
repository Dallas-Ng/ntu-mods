import { CHANGELOG } from "@/config/changelog-data"
import { SITE_ACTIVITY } from "@/config/site-activity"

const MONTHS = Object.entries(SITE_ACTIVITY.commitsByMonth)
const MAX = Math.max(...MONTHS.map(([, n]) => n))
const TOTAL = MONTHS.reduce((sum, [, n]) => sum + n, 0)

const monthName = (key: string) =>
  new Date(`${key}-01T00:00:00`).toLocaleDateString("en-SG", {
    month: "short",
    year: "numeric"
  })

// Shown only where the year changes, so the axis stays readable
const axisYears = new Set(["2024-01", "2025-01", "2026-01"])

const STATS = [
  { value: SITE_ACTIVITY.since, label: "Live since" },
  {
    value: String(SITE_ACTIVITY.mergedPullRequests),
    label: "Improvements merged"
  },
  { value: String(CHANGELOG.length), label: "Releases in the changelog" }
]

// Proof the site is looked after: real history, not a promise.
const LandingActivity = () => (
  <section className="mx-auto max-w-7xl px-4">
    <h2 className="landing-reveal max-w-3xl text-4xl leading-none font-bold tracking-tighter md:text-5xl">
      Built in 2023. Still improving.
    </h2>
    <p className="mt-4 max-w-2xl text-base md:text-lg">
      Plenty of student projects go quiet, fall out of date or go offline.
      NTUMods is still here, with new semester data and new features added as
      they are ready.
    </p>

    <div className="mt-10 grid gap-3 xl:grid-cols-[7fr_5fr]">
      <div className="bg-muted rounded-2xl p-5 md:p-7">
        <div className="grid grid-cols-3 gap-3">
          {STATS.map((s) => (
            <div key={s.label}>
              <p className="text-2xl leading-none font-bold tracking-tight sm:text-4xl">
                {s.value}
              </p>
              <p className="mt-2 text-sm md:text-base">{s.label}</p>
            </div>
          ))}
        </div>

        <div
          role="img"
          aria-label={`${TOTAL} commits since ${SITE_ACTIVITY.since}, month by month`}
          className="mt-8">
          <div className="flex h-40 items-end gap-0.5 md:h-48 md:gap-1">
            {MONTHS.map(([key, n]) => (
              <div
                key={key}
                title={`${monthName(key)}: ${n} commit${n === 1 ? "" : "s"}`}
                className="flex h-full flex-1 items-end">
                <div
                  className={`w-full rounded-sm ${n ? "bg-primary" : "bg-foreground/15"}`}
                  style={{
                    height: n ? `${Math.max((n / MAX) * 100, 4)}%` : "2px"
                  }}
                />
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-0.5 md:gap-1">
            {MONTHS.map(([key]) => (
              <div key={key} className="relative flex-1">
                {axisYears.has(key) && (
                  <span className="absolute left-0 text-sm whitespace-nowrap">
                    {key.slice(0, 4)}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="h-5" />
          <p className="text-sm md:text-base">
            Commits per month. Each bar is real history of this site.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-xl font-semibold">Latest updates</p>
        <ul className="flex flex-1 flex-col gap-3">
          {CHANGELOG.slice(0, 3).map((release) => (
            <li key={release.id} className="flex-1">
              <a
                href="/changelog"
                className="bg-muted hover:bg-accent flex h-full flex-col justify-center gap-1 rounded-2xl p-5 transition-colors duration-150">
                <span className="text-sm">{release.date}</span>
                <span className="text-lg font-semibold">{release.title}</span>
              </a>
            </li>
          ))}
        </ul>
        <a
          href="/changelog"
          className="text-primary text-lg font-semibold underline-offset-4 hover:underline">
          See the full changelog
        </a>
      </div>
    </div>
  </section>
)

export default LandingActivity
