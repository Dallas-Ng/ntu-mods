import { siteConfig } from "@/config/site"

// The two tools students ask about most, as large tiles with their guide.
const FEATURED: string[] = ["/tools/fgo-optimiser", "/tools/cgpa-planner"]

const LandingTools = () => {
  const tools = siteConfig.tools.filter((t) => FEATURED.includes(t.href))

  return (
    <section className="mx-auto max-w-7xl px-4">
      <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <h2 className="landing-reveal max-w-2xl text-3xl leading-none font-bold tracking-tighter md:text-4xl">
          Tools for your grades
        </h2>
        <a
          href="/tools"
          className="text-primary text-base font-semibold underline-offset-4 hover:underline">
          All student tools
        </a>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {tools.map((tool) => (
          <div
            key={tool.href}
            className="bg-muted landing-reveal flex min-h-[320px] flex-col justify-between gap-10 rounded-2xl p-5 md:p-6">
            <div>
              <h3 className="text-2xl leading-tight font-bold tracking-tight md:text-3xl">
                {tool.name}
                {tool.isNew && (
                  <span className="ml-3 inline-block rounded-full bg-yellow-400 px-3 py-1 align-middle text-sm font-semibold tracking-normal text-black">
                    New
                  </span>
                )}
              </h3>
              <p className="mt-4 max-w-md text-sm md:text-base">{tool.desc}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href={tool.href}
                className="bg-primary text-primary-foreground inline-flex h-12 items-center rounded-md px-6 text-sm font-semibold transition-transform md:px-8">
                Open the tool
              </a>
              {tool.guide && (
                <a
                  href={tool.guide.href}
                  className="bg-background hover:bg-accent inline-flex h-12 items-center rounded-md px-6 text-sm font-semibold transition-colors md:px-8">
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
