import { siteConfig } from "@/config/site"

import LandingCommands, { type Command } from "./landing-commands"

const FEATURES: Command[] = [
  {
    name: "Auto-generate timetable",
    art: "/landing/auto-generate.svg",
    href: "/timetable",
    desc: "Pick modules, set constraints like no mornings or free Fridays, and get every clash-free option."
  },
  {
    name: "Filter and search",
    art: "/landing/filter-search-manage.svg",
    href: "/timetable",
    desc: "Filter by day and time, search by code or title, and compare indexes without clicking through each one."
  },
  {
    name: "Multiple plans",
    art: "/landing/multiple-plans.svg",
    href: "/timetable",
    desc: "Keep backup timetables side by side and switch between them before you commit on STARS."
  },
  {
    name: "Custom blocks",
    art: "/landing/custom-blocks.svg",
    href: "/timetable",
    desc: "Block out CCAs, work shifts or gym sessions right alongside your modules."
  },
  {
    name: "Share with friends",
    art: "/landing/share-with-friends.svg",
    href: "/timetable",
    desc: "Share your timetable with anyone through a single link."
  },
  {
    name: "All courses and indexes",
    art: "/landing/icc-mods.svg",
    invert: true,
    href: "/mods",
    desc: "Including ICC modules and other special indexes not shown on STARS."
  },
  {
    name: "Save as photo or calendar",
    art: "/landing/save-as-photo.svg",
    href: "/screenshot",
    desc: "Export your timetable as a lockscreen photo or to your calendar."
  },
  {
    name: "Exam schedule",
    art: "/landing/exams.svg",
    href: "/exams",
    desc: "Browse exam dates, times and durations by module code for the current semester."
  },
  {
    name: "Student links",
    art: "/landing/links.svg",
    href: "/links",
    desc: "STARS, NTULearn, Degree Audit, library booking and more NTU portals in one place."
  },
  {
    name: "Planning guides",
    art: "/landing/guides.svg",
    href: "/articles",
    desc: "Step by step guides on STARS, module planning and picking indexes."
  },
  // Wallpaper Maker is the "Save as photo" row above
  ...siteConfig.tools
    .filter((tool) => tool.href !== "/screenshot")
    .map((tool) => ({
      name: tool.name,
      href: tool.href,
      desc: tool.desc
    }))
]

const LandingFeatures = () => (
  <div className="mx-auto max-w-7xl px-4">
    <LandingCommands commands={FEATURES} />
  </div>
)

export default LandingFeatures
