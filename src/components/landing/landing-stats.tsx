interface Props {
  semesterLabel: string
  modules: string
  indexes: string
}

const TILE =
  "bg-muted flex flex-col justify-between gap-8 rounded-2xl p-6 md:p-8"

// What is in the data this semester: real counts, links to what changed.
const LandingStats = ({ semesterLabel, modules, indexes }: Props) => {
  const year = semesterLabel.match(/AY(\d{4})/)?.[1]
  const sem = semesterLabel.match(/Semester (\w+)/)?.[1]
  return (
    <section
      aria-label={`${semesterLabel} data`}
      className="mx-auto grid max-w-7xl gap-3 px-4 md:grid-cols-4">
      <div className={`${TILE} landing-reveal`}>
        <p className="text-4xl leading-none font-bold tracking-tighter">
          Semester {sem}
        </p>
        <p className="text-lg font-semibold">
          {year
            ? `AY${year}/${String(Number(year) + 1).slice(2)}`
            : semesterLabel}
        </p>
      </div>
      <div className={`${TILE} landing-reveal`}>
        <p className="text-6xl leading-none font-bold tracking-tighter md:text-7xl">
          {modules}
        </p>
        <p className="text-lg font-semibold">Modules</p>
      </div>
      <div className={`${TILE} landing-reveal`}>
        <p className="text-6xl leading-none font-bold tracking-tighter md:text-7xl">
          {indexes}
        </p>
        <p className="text-lg font-semibold">Indexes</p>
      </div>
      <a
        href="/articles/ntu-ay2026-semester-2-whats-new"
        className="bg-primary text-primary-foreground landing-reveal flex flex-col justify-between gap-8 rounded-2xl p-6 transition-transform duration-150 active:scale-[0.98] md:p-8">
        <p className="text-3xl leading-tight font-bold tracking-tight">
          What changed this semester
        </p>
        <p className="text-lg font-semibold">Read the guide →</p>
      </a>
    </section>
  )
}

export default LandingStats
