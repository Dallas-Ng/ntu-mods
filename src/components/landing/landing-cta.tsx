import { Button } from "../ui/button"

interface Props {
  semesterLabel: string
  modules: string
  indexes: string
}

const LandingCTA = ({ semesterLabel, modules, indexes }: Props) => {
  return (
    <div className="z-10 flex items-center justify-center align-middle">
      <div className="max-w-[720px] text-center">
        <a
          href="/articles/ntu-ay2026-semester-2-whats-new"
          className="border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 mb-5 inline-flex flex-wrap items-center justify-center gap-x-2 rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition-colors">
          <span
            className="size-2 rounded-full bg-green-600"
            aria-hidden="true"
          />
          <span>Now live: {semesterLabel} data</span>
          <span className="font-medium tabular-nums">
            {modules} modules · {indexes} indexes →
          </span>
        </a>
        <h1 className="bg-gradient-to-l from-blue-600 to-blue-700 bg-clip-text pb-1 text-4xl leading-[1.1] font-bold tracking-tight text-balance text-transparent md:text-6xl">
          Build your NTU timetable in minutes
        </h1>

        <p className="text-muted-foreground mx-auto mt-5 max-w-lg text-lg text-balance md:text-xl">
          Pick your modules and get every clash-free option. Compare indexes,
          check exams and share your plan with friends.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button size="lg" className="w-full sm:w-fit" asChild>
            <a href="/timetable">Build my timetable</a>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="w-full sm:w-fit"
            asChild>
            <a href="/mods">Browse modules</a>
          </Button>
        </div>

        <p className="text-muted-foreground mt-4 text-sm">
          Free to use. No sign-up needed.
        </p>
      </div>
    </div>
  )
}

export default LandingCTA
