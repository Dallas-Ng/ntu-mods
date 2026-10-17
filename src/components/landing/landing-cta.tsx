import { Button } from "../ui/button"

const LandingCTA = () => {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pt-12 pb-12 md:pt-24 md:pb-16">
      <h1 className="animate-in fade-in slide-in-from-bottom-6 max-w-5xl text-5xl leading-[0.98] font-bold tracking-tighter duration-700 md:text-7xl lg:text-8xl">
        Build your NTU timetable
      </h1>

      <div className="mt-8 flex flex-col gap-6 md:mt-12 md:flex-row md:items-end md:justify-between">
        <p className="animate-in fade-in slide-in-from-bottom-4 max-w-xl text-lg delay-150 duration-700 md:text-xl">
          Pick your modules and get every clash-free option in minutes. Compare
          indexes, check exams and share your plan with friends.
        </p>

        <div className="animate-in fade-in slide-in-from-bottom-4 flex flex-col gap-3 delay-300 duration-700 sm:flex-row">
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
    </div>
  )
}

export default LandingCTA
