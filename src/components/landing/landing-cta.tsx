import { Button } from "../ui/button"

interface Props {
  semesterLabel: string
}

const LandingCTA = ({ semesterLabel }: Props) => {
  return (
    <div className="relative w-full">
      <a
        href="/articles/ntu-ay2026-semester-2-whats-new"
        className="bg-primary/15 text-foreground hover:bg-primary/25 mb-8 inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-base font-semibold whitespace-nowrap transition-colors">
        <span
          className="size-2.5 rounded-full bg-green-500"
          aria-hidden="true"
        />
        Now live: {semesterLabel} data →
      </a>
      <h1 className="max-w-5xl text-5xl leading-[0.98] font-bold tracking-tighter md:text-6xl xl:text-7xl">
        Build your NTU timetable
      </h1>

      <p className="mt-8 max-w-xl text-lg md:mt-10 md:text-xl">
        Pick your modules and get every clash-free option in minutes. Compare
        indexes, check exams and share your plan with friends.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
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
