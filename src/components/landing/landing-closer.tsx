const LandingCloser = () => (
  <section className="mx-auto mb-12 max-w-7xl px-4 md:mb-20">
    <div className="bg-primary text-primary-foreground flex min-h-[50svh] flex-col justify-end gap-8 rounded-3xl p-6 md:p-12">
      <h2 className="landing-reveal max-w-4xl text-[13vw] leading-[0.92] font-bold tracking-tighter md:text-8xl lg:text-9xl">
        Plan before STARS
      </h2>
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <p className="max-w-md text-lg">
          Free to use. Pick your modules and see every option.
        </p>
        <a
          href="/timetable"
          className="bg-primary-foreground text-primary inline-flex h-14 items-center justify-center rounded-md px-10 text-lg font-semibold transition-transform active:scale-[0.98]">
          Build my timetable
        </a>
      </div>
    </div>
  </section>
)

export default LandingCloser
