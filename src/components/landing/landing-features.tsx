import LandingCommands, { type Command } from "./landing-commands"

const FEATURES: Command[] = [
  {
    name: "Auto-generate timetable",
    art: "/landing/auto-generate.svg",
    artSize: [135, 128],
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

const LandingFeatures = () => (
  <div className="mx-auto max-w-7xl px-4">
    <LandingCommands commands={FEATURES} />
  </div>
)

export default LandingFeatures
