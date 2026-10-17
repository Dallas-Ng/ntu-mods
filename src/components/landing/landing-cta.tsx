import { Button } from "../ui/button"

interface Props {
  semesterLabel: string
  modules: string
  indexes: string
}

const LandingCTA = ({ semesterLabel, modules, indexes }: Props) => {
  return (
    <div className="relative mx-auto w-full max-w-7xl px-4 pt-12 pb-12 md:pt-24 md:pb-16">
      <a
        href="/articles/ntu-ay2026-semester-2-whats-new"
        className="bg-primary/15 text-foreground hover:bg-primary/25 animate-in fade-in mb-8 inline-flex flex-wrap items-center gap-x-2 rounded-full px-5 py-2 text-base font-semibold transition-colors duration-700">
        <span
          className="size-2.5 rounded-full bg-green-500"
          aria-hidden="true"
        />
        <span>Now live: {semesterLabel} data</span>
        <span className="font-medium">
          {modules} modules · {indexes} indexes →
        </span>
      </a>
      <h1 className="animate-in fade-in slide-in-from-bottom-6 max-w-5xl text-5xl leading-[0.98] font-bold tracking-tighter duration-700 md:text-7xl lg:text-8xl">
        Build your NTU timetable
      </h1>

      <p className="animate-in fade-in slide-in-from-bottom-4 mt-8 max-w-xl text-lg delay-150 duration-700 md:mt-10 md:text-xl">
        Pick your modules and get every clash-free option in minutes. Compare
        indexes, check exams and share your plan with friends.
      </p>

      <div className="animate-in fade-in slide-in-from-bottom-4 mt-8 flex flex-col gap-3 delay-300 duration-700 sm:flex-row">
        <Button
          size="lg"
          className="h-12 px-8 text-base active:scale-[0.98]"
          asChild>
          <a href="/timetable">Build my timetable</a>
        </Button>
        <Button
          size="lg"
          variant="secondary"
          className="h-12 px-8 text-base active:scale-[0.98]"
          asChild>
          <a href="/mods">Browse modules</a>
        </Button>
      </div>
    </div>
  )
}

export default LandingCTA
