import type { ReactNode } from "react"

import { siteConfig } from "@/config/site"

const CARD =
  "relative flex h-full min-h-[300px] w-full overflow-hidden rounded-xl border p-5 shadow"

type FeatureCardProps = {
  href?: string
  title: string
  desc: string
  src: string
  alt: string
  // "wide": big title on top, art beside (lg) or below the text
  // default: art on top, small title underneath
  wide?: boolean
}

// Text and art live in one flex column, so the art only ever gets the space
// the text leaves over and can never overlap it, at any width.
const FeatureCard = ({
  href,
  title,
  desc,
  src,
  alt,
  wide
}: FeatureCardProps) => {
  const body: ReactNode = (
    <div
      className={
        wide
          ? "flex w-full flex-col gap-3 lg:flex-row"
          : "flex w-full flex-col gap-3"
      }>
      {wide ? (
        <>
          <div className="lg:w-[55%] lg:shrink-0">
            <h3 className="text-2xl font-bold">{title}</h3>
            <p className="text-muted-foreground text-lg">{desc}</p>
          </div>
          <div className="relative min-h-[110px] min-w-0 flex-1">
            <img
              src={src}
              alt={alt}
              className="absolute inset-0 h-full w-full object-contain object-right-bottom"
            />
          </div>
        </>
      ) : (
        <>
          <div className="relative min-h-[110px] flex-1">
            <img
              src={src}
              alt={alt}
              className="absolute inset-0 h-full w-full object-contain"
            />
          </div>
          <div>
            <h3 className="mb-1 text-xl font-semibold">{title}</h3>
            <p className="text-muted-foreground">{desc}</p>
          </div>
        </>
      )}
    </div>
  )

  return href ? (
    <a href={href} className="cursor-pointer">
      <div className={CARD}>{body}</div>
    </a>
  ) : (
    <div className={CARD}>{body}</div>
  )
}

const ToolsCard = () => (
  <div className="flex flex-col gap-5 rounded-xl border p-5 shadow lg:flex-row lg:items-center">
    <div className="lg:w-[30%] lg:shrink-0">
      <h3 className="text-2xl font-bold">Student Tools</h3>
      <p className="text-muted-foreground text-lg">
        Free tools that run in your browser, from FGO planning to CGPA targets
      </p>
    </div>

    <div className="grid flex-1 gap-3 md:grid-cols-3">
      {siteConfig.tools.map((tool) => (
        <a
          key={tool.href}
          href={tool.href}
          className="hover:bg-accent flex flex-col gap-1 rounded-lg border p-4 transition-colors">
          <span className="flex items-center justify-between gap-2 font-semibold">
            {tool.name}
            {tool.isNew && (
              <span className="rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-semibold text-black">
                New
              </span>
            )}
          </span>
          <span className="text-muted-foreground text-sm">{tool.desc}</span>
        </a>
      ))}
    </div>
  </div>
)

const LandingFeatures = () => {
  return (
    <div>
      <div className="mb-6 text-center">
        <h2 className="text-4xl font-bold">
          Everything you need to plan your semester
        </h2>
        <p className="text-muted-foreground">
          From generating timetables to checking exams and finding student links
        </p>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-5">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <FeatureCard
            wide
            href="/timetable"
            title="Auto-Generate Your Timetable"
            desc="Pick your modules, set constraints like no mornings or free Fridays, and let NTU Mods build every clash-free option for you"
            src="/landing/auto-generate.svg"
            alt="Generated timetable"
          />
          <FeatureCard
            wide
            href="/timetable"
            title="Filter, Search and Manage"
            desc="Filter modules by day and time, search by code or title, and compare indexes without clicking through each one"
            src="/landing/filter-search-manage.svg"
            alt="Search and filter modules"
          />
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <FeatureCard
            href="/timetable"
            title="Multiple Plans"
            desc="Keep backup timetables side by side and switch between them before you commit on STARS"
            src="/landing/multiple-plans.svg"
            alt="Create 5 different plans"
          />
          <FeatureCard
            href="/timetable"
            title="Custom Blocks"
            desc="Block out CCAs, work shifts or gym sessions right alongside your modules"
            src="/landing/custom-blocks.svg"
            alt="Add custom blocks"
          />
          <FeatureCard
            href="/timetable"
            title="Share with Friends"
            desc="With a simple link, you can share your timetable with anyone"
            src="/landing/share-with-friends.svg"
            alt="share with your friends"
          />
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <a href="/mods" className="cursor-pointer">
            <div className="relative h-[300px] w-full overflow-hidden rounded-xl border p-3 shadow">
              <img
                src="/landing/icc-mods.svg"
                alt="view all courses and indexes"
                width={400}
                height={110}
                className="absolute right-[10%] bottom-[-20%] w-[70%] -rotate-45 p-5 invert dark:invert-0"
              />

              <div className="absolute bottom-8 left-8 w-10/12 md:bottom-3 md:left-3 lg:bottom-3 lg:left-8">
                <h3 className="mb-1 text-xl font-semibold">
                  View all Courses and Indexes
                </h3>
                <p className="text-muted-foreground">
                  Including your ICC modules and other special indexes not shown
                  on STARS
                </p>
              </div>
            </div>
          </a>

          <FeatureCard
            wide
            title="Save as Photo or Calendar"
            desc="NTU Mods supports exporting your timetable for your lockscreen photo to your calendar"
            src="/landing/save-as-photo.svg"
            alt="use on any devices"
          />
        </div>

        <ToolsCard />

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <FeatureCard
            href="/exams"
            title="Exam Schedule"
            desc="Browse exam dates, times and durations by module code for the current semester"
            src="/landing/exams.svg"
            alt="Exam schedule"
          />
          <FeatureCard
            href="/links"
            title="Student Links"
            desc="STARS, NTULearn, Degree Audit, library booking and more NTU portals in one place"
            src="/landing/links.svg"
            alt="Student links"
          />
          <FeatureCard
            href="/articles"
            title="Planning Guides"
            desc="Step by step guides on STARS, module planning and picking indexes, with the most read ones on top"
            src="/landing/guides.svg"
            alt="Planning guides"
          />
        </div>
      </div>
    </div>
  )
}

export default LandingFeatures
