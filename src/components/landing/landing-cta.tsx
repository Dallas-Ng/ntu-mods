import { ChevronRight } from "lucide-react"

import { Button } from "../ui/button"

interface Props {
  semesterLabel: string
}

const LandingCTA = ({ semesterLabel }: Props) => {
  return (
    <div className="relative w-full text-center xl:text-left">
      <a
        href="/articles/ntu-ay2026-semester-2-whats-new"
        className="bg-primary/15 text-foreground hover:bg-primary/25 mb-6 inline-flex items-center gap-2.5 rounded-full px-4 py-2 text-base font-semibold whitespace-nowrap transition-colors">
        <span
          className="size-2.5 rounded-full bg-green-500"
          aria-hidden="true"
        />
        Now live: {semesterLabel} data
        <ChevronRight aria-hidden="true" className="-ml-1 size-4" />
      </a>
      <h1 className="max-w-5xl text-5xl leading-[0.98] font-bold tracking-tighter md:text-6xl xl:text-7xl">
        Build your NTU timetable
      </h1>

      <p className="mx-auto mt-6 max-w-xl text-lg md:text-xl xl:mx-0">
        Pick your modules and get every clash-free option in minutes. Compare
        indexes, check exams and share your plan with friends.
      </p>

      <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row xl:justify-start">
        <Button
          size="lg"
          className="h-12 px-6 text-base active:scale-[0.98] md:px-8"
          asChild>
          <a href="/timetable">Build my timetable</a>
        </Button>
        <Button
          size="lg"
          variant="secondary"
          className="h-12 px-6 text-base active:scale-[0.98] md:px-8"
          asChild>
          <a href="/mods">Browse modules</a>
        </Button>
      </div>
    </div>
  )
}

export default LandingCTA
