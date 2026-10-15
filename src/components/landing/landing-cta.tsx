import { Button } from "../ui/button"

interface Props {
  semesterLabel: string
  modules: string
  indexes: string
}

const LandingCTA = ({ semesterLabel, modules, indexes }: Props) => {
  return (
    <div className="z-10 flex items-center justify-center pt-6 pb-2 md:pt-12">
      <div className="max-w-[760px] text-center">
        <a
          href="/articles/ntu-ay2026-semester-2-whats-new"
          className="border-primary/30 bg-primary/10 text-primary hover:bg-primary/15 focus-visible:ring-ring mb-6 inline-flex flex-wrap items-center justify-center gap-x-2 rounded-full border px-4 py-1.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none">
          <span className="relative flex size-2" aria-hidden="true">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-green-500 opacity-60 motion-reduce:animate-none" />
            <span className="relative inline-flex size-2 rounded-full bg-green-600" />
          </span>
          <span>Now live: {semesterLabel} data</span>
          <span className="text-primary/80">
            {modules} modules · {indexes} indexes →
          </span>
        </a>
        <h1 className="text-4xl leading-[1.05] font-bold tracking-tight text-balance md:text-6xl lg:text-7xl">
          Build your NTU timetable{" "}
          <span className="bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent">
            in minutes
          </span>
        </h1>

        <p className="text-muted-foreground mx-auto mt-5 max-w-xl text-lg text-pretty md:text-xl">
          Pick your modules and get every clash-free option. Compare indexes,
          check exams and share your plan with friends.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" className="w-full sm:w-fit" asChild>
            <a href="/timetable">Build my timetable →</a>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full sm:w-fit"
            asChild>
            <a href="/mods">Browse modules</a>
          </Button>
        </div>

        <dl className="text-muted-foreground mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-sm">
          <div className="flex items-baseline gap-1.5">
            <dt className="sr-only">Modules</dt>
            <dd className="text-foreground font-semibold tabular-nums">
              {modules}
            </dd>
            <span aria-hidden="true">modules</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <dt className="sr-only">Indexes</dt>
            <dd className="text-foreground font-semibold tabular-nums">
              {indexes}
            </dd>
            <span aria-hidden="true">indexes</span>
          </div>
          <span>Free, no sign-up</span>
        </dl>
      </div>
    </div>
  )
}

export default LandingCTA
