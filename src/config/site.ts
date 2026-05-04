export const siteConfig = {
  url: "https://ntumods.com",
  name: "NTUMods",
  ogImage: "https://ntumods.com/og-image.png",
  metatags: {
    default: {
      title: "NTU Timetable Planner and Module Finder | NTUMods",
      desc: "Plan NTU timetables, browse modules, compare indexes, check exams, share schedules, and export calendars or wallpapers in one course planning tool.",
      keywords: [
        "NTU",
        "Nanyang Technological University",
        "stars",
        "STARS",
        "ntumods",
        "ntu mods",
        "ntu stars"
      ],
      authors: [
        {
          name: "Dallas Ng",
          url: "https://github.com/Dallas-Ng"
        }
      ]
    },
    timetable: {
      title: "NTU Timetable Planner",
      desc: "Build your NTU timetable by searching modules and indexes, checking clashes, comparing class times, and exporting your schedule to calendar, image, or share link."
    },
    share: {
      title: "Shared NTU Timetable",
      desc: "Open a shared NTU timetable, review the modules and class times, then copy it into your own NTUMods planner to edit."
    },
    mods: {
      title: "NTU Modules and Indexes",
      desc: "Search NTU modules by code, title, faculty, level, AU, and type. View descriptions, prerequisites, exams, indexes, class times, and venues."
    },
    help: {
      title: "NTUMods Help",
      desc: "Find quick answers for planning NTU timetables, browsing modules, choosing indexes, exporting schedules, sharing links, and fixing local app issues."
    },
    privacy: {
      title: "NTUMods Privacy Policy",
      desc: "Learn what NTUMods stores locally, what analytics may collect, how feedback submissions are handled, and how your timetable data stays on your device."
    },
    screenshot: {
      title: "NTU Timetable Wallpaper Maker",
      desc: "Compose your NTU timetable as a clean lockscreen wallpaper or shareable image, with presets for phone screens and simple positioning controls."
    },
    settings: {
      title: "NTUMods Settings",
      desc: "Customize NTUMods themes, table density, timetable colors, class details, and feedback settings so your planner works the way you prefer."
    },
    changelog: {
      title: "NTUMods Changelog",
      desc: "See recent NTUMods updates, including timetable planning improvements, module browser changes, article guides, data refreshes, and export fixes."
    },
    articles: {
      title: "NTU Module Planning Guides",
      desc: "Read NTUMods guides on planning NTU modules, choosing BDEs, understanding Common Core modules, balancing workload, and preparing for STARS."
    },
    debug: {
      title: "Reset NTUMods Data",
      desc: "Inspect and reset local NTUMods timetable data when your planner, settings, or saved modules behave unexpectedly after an update."
    }
  },
  navLinks: [
    { label: "Timetable", route: "/timetable" },
    { label: "Mods", route: "/mods" },
    { label: "Articles", route: "/articles" },
    { label: "Help", route: "/help" }
  ],
  links: {
    github: "https://github.com/Dallas-Ng",
    linkedIn: "https://www.linkedin.com/in/dallas-ng/",
    repo: "https://github.com/Dallas-Ng/ntu-dabao",
    telegram: "https://t.me/dallas_ng"
  }
} as const
