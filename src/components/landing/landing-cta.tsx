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
          className="mb-5 inline-flex flex-wrap items-center justify-center gap-x-2 rounded-full border-2 border-yellow-400 bg-yellow-100 px-4 py-1.5 text-sm font-semibold text-black transition-colors hover:bg-yellow-200">
          <span
            className="size-2 rounded-full bg-green-600"
            aria-hidden="true"
          />
          <span>Now live: {semesterLabel} data</span>
          <span className="font-medium">
            {modules} modules · {indexes} indexes →
          </span>
        </a>
        <h1 className="bg-gradient-to-l from-blue-600 to-blue-700 bg-clip-text text-4xl leading-tight font-bold text-transparent md:text-6xl">
          Build your NTU timetable in minutes
        </h1>

        <p className="text-muted-foreground mx-auto mt-4 max-w-lg text-lg">
          Pick your modules and get every clash-free option. Compare indexes,
          check exams and share your plan with friends.
        </p>

        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
      </div>
    </div>
  )
}

export default LandingCTA
