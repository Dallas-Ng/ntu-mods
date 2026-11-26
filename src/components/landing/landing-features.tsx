import type { ComponentType } from "react"
import {
  Footprints,
  Image as ImageIcon,
  Layers,
  Share2,
  SlidersHorizontal,
  SquareDashed
} from "lucide-react"

import { cn } from "@/lib/utils"
import { cardVariants } from "@/components/ui/card"
import { TextLink } from "@/components/ui/text-link"
import { NewBadge } from "@/components/new-dot"

import TimetableGenerationPreview from "./timetable-generation-preview"

type Feature = {
  name: string
  href: string
  desc: string
  art?: string
  /** Intrinsic [width, height] of `art`, so the image reserves its aspect ratio. */
  artSize?: [number, number]
  isNew?: boolean
}

const FEATURES: Feature[] = [
  {
    name: "Auto-generate timetable",
    href: "/timetable",
    desc: "Pick modules, set constraints like no mornings or free Fridays, and get every clash-free option."
  },
  {
    name: "Walking between classes",
    art: "/landing/maps.svg",
    artSize: [203, 71],
    href: "/timetable",
    isNew: true,
    desc: "See your day on the campus map with the walk between each class, and a warning when the gap is too short."
  },
  {
    name: "Filter and search",
    art: "/landing/filter-search-manage.svg",
    artSize: [109, 115],
    href: "/timetable",
    desc: "Filter by day and time, search by code or title, and compare indexes without clicking through each one."
  },
  {
    name: "Multiple plans",
    art: "/landing/multiple-plans.svg",
    artSize: [149, 81],
    href: "/timetable",
    desc: "Keep up to five named plans, such as a backup with no Friday classes, and switch between them before you commit on STARS."
  },
  {
    name: "Custom blocks",
    art: "/landing/custom-blocks.svg",
    artSize: [185, 144],
    href: "/timetable",
    desc: "Block out CCAs, work shifts or gym sessions right alongside your modules."
  },
  {
    name: "Share with friends",
    art: "/landing/share-with-friends.svg",
    artSize: [200, 110],
    href: "/timetable",
    desc: "Share your timetable with anyone through a single link."
  },
  {
    name: "All courses and indexes",
    art: "/landing/all-courses.svg",
    artSize: [150, 90],
    href: "/mods",
    desc: "Including ICC modules and other special indexes not shown on STARS."
  },
  {
    name: "Save as photo or calendar",
    art: "/landing/save-as-photo.svg",
    artSize: [260, 244],
    href: "/screenshot",
    desc: "Export your timetable as a lockscreen photo or to your calendar."
  },
  {
    name: "Exam schedule",
    art: "/landing/exams.svg",
    artSize: [203, 71],
    href: "/exams",
    desc: "Browse exam dates, times and durations by module code for the current semester."
  },
  {
    name: "Academic calendar",
    href: "/calendar",
    desc: "See teaching weeks, recess, exams and public holidays, or subscribe in your calendar app."
  },
  {
    name: "Campus map",
    art: "/landing/maps.svg",
    artSize: [203, 71],
    href: "/maps",
    desc: "Find any lecture theatre or room, see which level it is on and get walking directions."
  },
  {
    name: "Student links",
    art: "/landing/links.svg",
    artSize: [190, 157],
    href: "/links",
    desc: "STARS, NTULearn, Degree Audit, library booking and more NTU portals in one place."
  },
  {
    name: "Planning guides",
    art: "/landing/guides.svg",
    artSize: [175, 173],
    href: "/articles",
    desc: "Step by step guides on STARS, module planning and picking indexes."
  },
  {
    name: "Student tools",
    href: "/tools",
    desc: "Free tools that run in your browser, from FGO planning to CGPA targets."
  }
]

const byName = (n: string) => FEATURES.find((f) => f.name === n) as Feature

// The headline feature, shown large
const HERO = byName("Auto-generate timetable")

// The timetable features, as small cards
const CORE: [string, ComponentType<{ className?: string }>][] = [
  ["Walking between classes", Footprints],
  ["Filter and search", SlidersHorizontal],
  ["Multiple plans", Layers],
  ["Custom blocks", SquareDashed],
  ["Share with friends", Share2],
  ["Save as photo or calendar", ImageIcon]
]

// Everything else is a link in a row under the cards
const ALSO = [
  "All courses and indexes",
  "Exam schedule",
  "Academic calendar",
  "Campus map",
  "Student links",
  "Planning guides",
  "Student tools"
].map(byName)

const LandingFeatures = () => (
  <section
    aria-labelledby="landing-features-heading"
    className="mx-auto max-w-7xl px-4">
    <h2
      id="landing-features-heading"
      className="landing-reveal mb-10 max-w-2xl text-3xl leading-none font-bold tracking-tighter md:text-4xl">
      Everything you need to plan your semester
    </h2>

    <div className="grid gap-3 lg:grid-cols-[5fr_7fr]">
      <div
        className={cn(
          cardVariants(),
          "flex min-w-0 flex-col gap-5 p-3 sm:p-4 md:p-6"
        )}>
        <TimetableGenerationPreview />
        <div>
          <h3 className="text-2xl leading-tight font-bold tracking-tight">
            {HERO.name}
          </h3>
          <p className="mt-2 max-w-md text-sm md:text-base">{HERO.desc}</p>
          <TextLink href={HERO.href} variant="action" arrow className="mt-2">
            Open timetable planner
          </TextLink>
        </div>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {CORE.map(([name, Icon]) => {
          const f = byName(name)
          return (
            <li key={f.name} className="contents">
              <a
                href={f.href}
                className={cn(
                  cardVariants({ interactive: true }),
                  "flex flex-col gap-3 p-4 md:p-5"
                )}>
                <Icon className="text-muted-foreground size-5" />
                <span>
                  <span className="block text-base leading-tight font-bold">
                    {f.name}
                    {f.isNew && (
                      <NewBadge size="md" className="ml-2 align-middle" />
                    )}
                  </span>
                  <span className="text-muted-foreground mt-1 block text-sm">
                    {f.desc}
                  </span>
                </span>
              </a>
            </li>
          )
        })}
      </ul>
    </div>

    <ul className="landing-reveal mt-6 flex flex-wrap items-center gap-x-6 gap-y-2">
      <li className="text-muted-foreground text-sm">Also included</li>
      {ALSO.map((f) => (
        <li key={f.name}>
          <TextLink href={f.href} variant="action" className="text-sm">
            {f.name}
          </TextLink>
        </li>
      ))}
    </ul>
  </section>
)

export default LandingFeatures
