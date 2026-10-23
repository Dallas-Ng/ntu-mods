import { CHANGELOG } from "@/config/changelog-data"
import { TextLink } from "@/components/ui/text-link"

const CHANGES = CHANGELOG.reduce((sum, r) => sum + r.items.length, 0)

const RELEASES = CHANGELOG

const YEAR_MS = 365 * 24 * 60 * 60 * 1000
const LAST_12_MONTHS = RELEASES.filter(
  (r) => Date.now() - new Date(r.date).getTime() < YEAR_MS
).length

const RECENT = RELEASES.slice(0, 4)

// Proof the site is looked after: how often it changes, and the latest changes.
const LandingActivity = () => (
  <section className="mx-auto max-w-7xl px-4">
    <h2 className="landing-reveal max-w-3xl text-4xl leading-none font-bold tracking-tighter md:text-5xl">
      Built in 2023. Still improving.
    </h2>
    <p className="mt-4 max-w-2xl text-sm md:text-base">
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
            <p className="text-4xl leading-none font-bold tracking-tighter md:text-5xl">
              {s.value}
            </p>
            <p className="text-lg font-semibold">{s.label}</p>
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
                  <span className="flex-1 text-base font-semibold">
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
        <TextLink
          href="/changelog"
          variant="action"
          className="mt-1 mb-1 ml-6 inline-block text-base">
          See everything we have added
        </TextLink>
      </div>
    </div>
  </section>
)

export default LandingActivity
