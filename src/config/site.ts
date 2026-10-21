export const siteConfig = {
  url: "https://ntumods.com",
  name: "NTUMods",
  ogImage: "https://ntumods.com/og-image.png",
  ogImageAlt:
    "NTUMods: build your NTU timetable in minutes, shown with a weekly class schedule",
  metatags: {
    default: {
      title: "NTU Timetable Planner and Module Finder | NTUMods",
      desc: "Plan NTU timetables, compare indexes, check exams, and use free tools like the FGO optimiser and CGPA planner. Share and export your schedule.",
      keywords: [
        "NTU",
        "Nanyang Technological University",
        "stars",
        "STARS",
        "ntumods",
        "ntu mods",
        "ntu stars",
        "ntu courses",
        "ntu timetable",
        "ntu modules",
        "ntu course planner"
      ],
      authors: [
        {
          name: "Dallas Ng",
          url: "https://github.com/Dallas-Ng"
        }
      ]
    },
    timetable: {
      title: "NTU Timetable Planner: Build Your STARS Schedule",
      desc: "Plan your NTU timetable for STARS registration. Compare indexes, check clashes, see the walk between classes on the campus map, and share or export to calendar. No login."
    },
    share: {
      title: "Shared NTU Timetable",
      desc: "Open a shared NTU timetable, review the modules and class times, then copy it into your own NTUMods planner to edit."
    },
    mods: {
      title: "NTU Modules, Courses & Indexes",
      desc: "Browse all NTU courses and modules. Search by code or title, compare indexes, check exam dates, view class times, venues, and prerequisites. Updated each semester."
    },
    faq: {
      title: "FAQ: Frequently Asked Questions",
      desc: "Find quick answers for planning NTU timetables, browsing modules, choosing indexes, exporting schedules, sharing links, and understanding how your data is stored."
    },
    privacy: {
      title: "Privacy Policy",
      desc: "Learn what NTUMods stores locally, what analytics may collect, how feedback submissions are handled, and how your timetable data stays on your device."
    },
    screenshot: {
      title: "NTU Timetable Wallpaper Maker",
      desc: "Compose your NTU timetable as a clean lockscreen wallpaper or shareable image, with presets for phone screens and simple positioning controls."
    },
    settings: {
      title: "Settings",
      desc: "Customize NTUMods themes, table density, timetable colors, class details, and feedback settings so your planner works the way you prefer."
    },
    changelog: {
      title: "Changelog",
      desc: "See recent NTUMods updates, including timetable planning improvements, module browser changes, article guides, data refreshes, and export fixes."
    },
    articles: {
      title: "NTU Module Planning Guides",
      desc: "Read NTUMods guides on planning NTU modules, choosing BDEs, understanding Common Core modules, balancing workload, and preparing for STARS."
    },
    developers: {
      title: "NTUMods API for Developers",
      desc: "Free public API and open data for NTU modules, class indexes and exam timetables. No key needed. Built for student projects and AI tools."
    },
    sitemap: {
      title: "Sitemap",
      desc: "Browse every major NTUMods page, planning guide, and NTU module detail page from one organized sitemap."
    },
    debug: {
      title: "Reset Data",
      desc: "Inspect and reset local NTUMods timetable data when your planner, settings, or saved modules behave unexpectedly after an update."
    },
    feedback: {
      title: "Feedback",
      desc: "Share feedback, report issues, or suggest improvements for NTUMods. This project is maintained by one person and all input is appreciated."
    },
    studentLinks: {
      title: "NTU Student Links",
      desc: "Quick links to the most-used NTU student portals — STARS, NTULearn, Degree Audit, CareerAxis, GEM, library booking, and more."
    },
    tools: {
      title: "NTU Student Tools",
      desc: "Free tools for NTU students: the FGO Optimiser for choosing which modules to Flexible-Grade, a CGPA planner for honours classes, a timetable wallpaper maker, and more."
    },
    cgpa: {
      title: "NTU CGPA Calculator: What Grades Do You Need for Honours?",
      desc: "Free NTU CGPA planner. Enter your CGPA and remaining AU, or upload your transcript, to see the average grade needed for Merit, Distinction or Highest Distinction. Runs in your browser."
    },
    fgo: {
      title: "NTU FGO Optimiser: Which Modules Should You FGO?",
      desc: "Upload your NTU transcript and find the modules to Flexible-Grade (FGO) for the highest CGPA. Handles earlier FGO and S/U use. Runs in your browser, nothing is uploaded."
    },
    exams: {
      title: "NTU Exam Schedule",
      desc: "Browse the NTU exam schedule by date, time, and module code. Find exam durations and search by module for the current semester.",
      keywords: [
        "NTU exam schedule",
        "NTU exam timetable",
        "NTU exam dates",
        "NTU final exams",
        "Nanyang Technological University exam schedule",
        "NTU exam times"
      ]
    }
  },
  navLinks: [
    { label: "Timetable", route: "/timetable" },
    { label: "Mods", route: "/mods" },
    { label: "Exams", route: "/exams" },
    { label: "Maps", route: "/maps" },
    { label: "Tools", route: "/tools" },
    { label: "Articles", route: "/articles" },
    { label: "Links", route: "/links" }
  ],
  tools: [
    {
      name: "FGO Optimiser",
      href: "/tools/fgo-optimiser",
      isNew: true,
      desc: "Upload your transcript and find the modules to Flexible-Grade for the highest CGPA",
      facts: ["Reads your transcript PDF", "24 or 21 AU quota"],
      time: "5 min",
      guide: {
        label: "Step-by-step guide",
        href: "/articles/ntu-fgo-optimiser-guide"
      }
    },
    {
      name: "CGPA Planner",
      href: "/tools/cgpa-planner",
      isNew: true,
      desc: "See the average grade you need over your remaining AU to reach Merit, Distinction or Highest Distinction",
      facts: ["Type your CGPA or upload", "Grade needed per class"],
      time: "2 min",
      guide: {
        label: "Step-by-step guide",
        href: "/articles/ntu-cgpa-planner-guide"
      }
    },
    {
      name: "Wallpaper Maker",
      href: "/screenshot",
      isNew: false,
      desc: "Export your timetable as a phone wallpaper or shareable image",
      facts: ["Phone sized", "Uses your timetable"],
      time: "1 min",
      guide: null
    }
  ],
  links: {
    github: "https://github.com/Dallas-Ng",
    linkedIn: "https://www.linkedin.com/in/dallas-ng/",
    repo: "https://github.com/Dallas-Ng/ntu-dabao",
    telegram: "https://t.me/dallas_ng"
  }
} as const
