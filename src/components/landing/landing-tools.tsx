import { siteConfig } from "@/config/site"

// The two tools students ask about most, as large tiles with their guide.
const FEATURED = ["/tools/fgo-optimiser", "/tools/cgpa-planner"]

const LandingTools = () => {
  const tools = FEATURED.map((href) =>
    siteConfig.tools.find((t) => t.href === href)
  ).filter((t): t is (typeof siteConfig.tools)[number] => Boolean(t))

  return (
    <section className="mx-auto max-w-7xl px-4">
      <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <h2 className="landing-reveal max-w-2xl text-4xl leading-none font-bold tracking-tighter md:text-5xl">
          Tools for your grades
        </h2>
        <a
          href="/tools"
          className="text-primary text-lg font-semibold underline-offset-4 hover:underline">
          All student tools
        </a>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {tools.map((tool) => (
          <div
            key={tool.href}
            className="bg-muted landing-reveal flex min-h-[320px] flex-col justify-between gap-10 rounded-2xl p-6 md:p-8">
            <div>
              <h3 className="text-3xl leading-tight font-bold tracking-tight md:text-4xl">
                {tool.name}
                {tool.isNew && (
                  <span className="ml-3 inline-block rounded-full bg-yellow-400 px-3 py-1 align-middle text-sm font-semibold tracking-normal text-black">
                    New
                  </span>
                )}
              </h3>
              <p className="mt-4 max-w-md text-base md:text-lg">{tool.desc}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href={tool.href}
                className="bg-primary text-primary-foreground inline-flex h-12 items-center rounded-md px-6 text-base font-semibold transition-transform active:scale-[0.98]">
                Open the tool
              </a>
              {tool.guide && (
                <a
                  href={tool.guide.href}
                  className="bg-background hover:bg-accent inline-flex h-12 items-center rounded-md px-6 text-base font-semibold transition-colors">
                  {tool.guide.label}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default LandingTools
