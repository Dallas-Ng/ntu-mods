import {
  BookOpen,
  Bot,
  Braces,
  BusFront,
  Calculator,
  CalendarCheck,
  CalendarDays,
  CalendarPlus,
  ClipboardCheck,
  Compass,
  Footprints,
  Github,
  GraduationCap,
  Heart,
  House,
  Layers,
  Library,
  Map as MapIcon,
  MousePointerClick,
  Presentation,
  Rocket,
  Shapes,
  Smartphone,
  TrendingUp,
  Utensils,
  type LucideIcon
} from "lucide-react"

import { siteConfig } from "@/config/site"
import { LINK_CATEGORIES, QUICK_LINKS } from "@/config/student-links"

/**
 * What each dropdown in the desktop navbar holds. Top-level items without an
 * entry here are plain links. Widths are fixed (in rem) so the navbar can keep
 * a menu inside the window before it opens; keep them in step with the grids in
 * mega-menu.tsx.
 */

export interface MenuLink {
  label: string
  href: string
  desc?: string
  icon?: LucideIcon
  isNew?: boolean
  external?: boolean
  /** A MODULE_CATEGORY key: shows this semester's module count for it. */
  count?: string
  /** A short fact under a card, like how long a tool takes. */
  meta?: string
  /** Replaces `meta` with where the semester is now ("Teaching week 5"). */
  liveWeek?: boolean
  /** A second link on a card, to its how-to article. */
  guide?: { label: string; href: string }
}

export interface MenuAside {
  title: string
  items: MenuLink[]
}

interface MenuBase {
  aside?: MenuAside
  /** A "see all" row under the panel, unless the panel already links there. */
  footer?: { label: string; href: string }
}

/** Icon rows: a name and one line on what is there. */
export interface ListMenu extends MenuBase {
  kind: "list"
  title: string
  items: MenuLink[]
  /** Two columns of rows, for short labels like places. */
  columns?: 2
}

/** Cards in a 2-column grid: a name, what it does, and a fact or guide. */
export interface CardMenu extends MenuBase {
  kind: "cards"
  title: string
  items: MenuLink[]
}

export type Menu = ListMenu | CardMenu

const TOOL_DETAILS: Record<string, { icon: LucideIcon; desc: string }> = {
  "/developers/mcp": {
    icon: Bot,
    desc: "Ask Claude or ChatGPT about modules and exams"
  },
  "/tools/fgo-optimiser": {
    icon: TrendingUp,
    desc: "Find which modules to Flexible-Grade"
  },
  "/tools/cgpa-planner": {
    icon: Calculator,
    desc: "The grades you need for each honours class"
  },
  "/screenshot": {
    icon: Smartphone,
    desc: "Turn your timetable into a lock screen"
  }
}

const QUICK_LINK_DETAILS: Record<
  string,
  { icon: LucideIcon; meta?: string; liveWeek?: boolean; guide?: string }
> = {
  STARS: {
    icon: CalendarCheck,
    meta: "NTU login",
    guide: "/articles/ntu-stars-guide"
  },
  NTULearn: {
    icon: GraduationCap,
    meta: "NTU login",
    guide: "/articles/ntu-ntulearn-guide"
  },
  "Degree Audit": {
    icon: ClipboardCheck,
    meta: "NTU login",
    guide: "/articles/ntu-degree-audit-guide"
  },
  "Academic Calendar": {
    icon: CalendarDays,
    guide: "/articles/ntu-academic-calendar-ay2026"
  }
}

// Portals listed beside the quick links, by their name on /links.
const MORE_PORTALS = [
  "Student Email",
  "Library Booking",
  "CareerAxis",
  "GEM Portal",
  "Fee Payment"
]

const portal = (name: string) => {
  const link = LINK_CATEGORIES.flatMap((c) =>
    c.type === "external" ? c.links : []
  ).find((l) => l.name === name)
  if (!link) throw new Error(`Portal "${name}" is not in LINK_CATEGORIES`)
  return link
}

export const NAV_MENUS: Record<string, Menu> = {
  "/mods": {
    kind: "list",
    title: "Browse modules",
    items: [
      {
        label: "All modules",
        href: "/mods",
        desc: "Search by code, title or school",
        icon: Library
      },
      {
        label: "BDEs",
        href: "/mods?moduleType=GLOAD",
        desc: "Broadening and deepening electives",
        icon: Shapes,
        count: "GLOAD"
      },
      {
        label: "Minors",
        href: "/mods?moduleType=MLOAD",
        desc: "Modules that count to a minor",
        icon: Layers,
        count: "MLOAD"
      },
      {
        label: "General Education",
        href: "/mods?moduleType=GERP",
        desc: "General Education Requirement",
        icon: Compass,
        count: "GERP"
      },
      {
        label: "Favourites",
        href: "/mods?favouritesOnly=true",
        desc: "Modules you have saved",
        icon: Heart
      }
    ],
    aside: {
      title: "BDE guides",
      items: [
        { label: "Complete BDE list", href: "/articles/complete-ntu-bde-list" },
        { label: "Easy BDEs", href: "/articles/easy-bde-at-ntu" },
        {
          label: "Most popular BDEs",
          href: "/articles/most-popular-bdes-at-ntu"
        },
        {
          label: "How to bid for a BDE",
          href: "/articles/how-to-bid-for-bde-at-ntu"
        }
      ]
    }
  },
  // Places first: finding food, a lecture theatre or a classroom is a daily
  // need. The map's own features sit in the side list.
  "/maps": {
    kind: "list",
    columns: 2,
    title: "Browse places",
    items: [
      {
        label: "Food",
        href: "/maps?cat=food",
        desc: "Canteens and cafes",
        icon: Utensils
      },
      {
        label: "Lecture theatres",
        href: "/maps?cat=lt",
        desc: "Every LT on campus",
        icon: Presentation
      },
      {
        label: "Study spaces",
        href: "/maps?cat=study",
        desc: "Libraries and study lounges",
        icon: Library
      },
      {
        label: "Bus and MRT",
        href: "/maps?cat=transport",
        desc: "Shuttle stops and stations",
        icon: BusFront
      },
      {
        label: "Exam halls",
        href: "/maps?cat=exam",
        desc: "Where your papers are held",
        icon: GraduationCap
      },
      {
        label: "Halls",
        href: "/maps?cat=hall",
        desc: "Halls of residence",
        icon: House
      }
    ],
    aside: {
      title: "Campus map",
      items: [
        { label: "Find a room", href: "/maps", icon: MapIcon },
        {
          label: "Walk between classes",
          href: "/timetable",
          icon: Footprints
        },
        {
          label: "How to use the map",
          href: "/articles/ntu-campus-map-guide",
          icon: BookOpen
        }
      ]
    }
  },
  "/calendar": {
    kind: "list",
    title: "Academic calendar",
    items: [
      {
        label: "This semester",
        href: "/calendar",
        desc: "Teaching weeks, recess, exams and holidays",
        icon: CalendarDays,
        liveWeek: true
      },
      {
        label: "Add to your calendar",
        href: "/calendar.ics",
        desc: "Every date as an .ics file for your calendar app",
        icon: CalendarPlus
      },
      {
        label: "Plan around the calendar",
        href: "/articles/ntu-academic-calendar-ay2026",
        desc: "Registration, add/drop and each part of the semester",
        icon: BookOpen
      }
    ],
    aside: {
      title: "Related",
      items: [
        { label: "Exam schedule", href: "/exams", icon: GraduationCap },
        {
          label: "NTU's official calendar",
          href: "https://www.ntu.edu.sg/admissions/matriculation/academic-calendars",
          external: true
        }
      ]
    }
  },
  "/tools": {
    kind: "cards",
    title: "Tools",
    items: siteConfig.tools.map((tool) => ({
      label: tool.name,
      href: tool.href,
      icon: TOOL_DETAILS[tool.href]?.icon,
      desc: TOOL_DETAILS[tool.href]?.desc ?? tool.desc,
      isNew: tool.isNew,
      meta: `${tool.time} · ${tool.facts[0]}`,
      // No guide link when the guide is the tool page itself.
      guide:
        tool.guide && tool.guide.href !== tool.href
          ? { label: "Guide", href: tool.guide.href }
          : undefined
    })),
    footer: { label: "All tools", href: "/tools" }
  },
  "/articles": {
    kind: "list",
    title: "Popular guides",
    items: [
      {
        label: "STARS registration guide",
        href: "/articles/ntu-stars-guide",
        desc: "Plan, bid and get the indexes you want",
        icon: CalendarCheck
      },
      {
        label: "Complete BDE list",
        href: "/articles/complete-ntu-bde-list",
        desc: "Every BDE category and module this semester",
        icon: Shapes
      },
      {
        label: "FGO and S/U option",
        href: "/articles/ntu-fgo-su-option-guide",
        desc: "When to Flexible-Grade a module",
        icon: TrendingUp
      },
      {
        label: "Academic calendar",
        href: "/articles/ntu-academic-calendar-ay2026",
        desc: "Semester dates, recess and exam weeks",
        icon: CalendarDays
      }
    ],
    aside: {
      title: "Topics",
      items: [
        { label: "BDE", href: "/articles?category=bde" },
        { label: "STARS", href: "/articles?category=stars" },
        {
          label: "Module planning",
          href: "/articles?category=module-planning"
        },
        { label: "Common Core", href: "/articles?category=common-core" },
        {
          label: "Timetable planning",
          href: "/articles?category=timetable-planning"
        }
      ]
    },
    footer: { label: "All articles", href: "/articles" }
  },
  "/links": {
    kind: "cards",
    title: "Most used",
    items: QUICK_LINKS.map((link) => {
      const details = QUICK_LINK_DETAILS[link.name]
      return {
        label: link.name,
        href: link.href,
        desc: link.desc,
        icon: details?.icon,
        external: true,
        meta: details?.meta,
        liveWeek: details?.liveWeek,
        guide: details?.guide
          ? { label: "Guide", href: details.guide }
          : undefined
      }
    }),
    aside: {
      title: "More portals",
      items: MORE_PORTALS.map((name) => ({
        label: name,
        href: portal(name).href,
        external: true
      }))
    },
    footer: { label: "All student links", href: "/links" }
  },
  "/developers": {
    kind: "list",
    title: "Build with NTUMods",
    items: [
      {
        label: "MCP server",
        href: "/developers/mcp",
        desc: "Ask Claude or ChatGPT about modules",
        icon: Bot
      },
      {
        label: "REST API",
        href: "/developers/api",
        desc: "Modules, indexes and exams as JSON",
        icon: Braces
      },
      {
        label: "WebMCP",
        href: "/developers/webmcp",
        desc: "Let an assistant edit your saved plans",
        icon: MousePointerClick
      },
      {
        label: "Quickstart",
        href: "/developers/quickstart",
        desc: "Your first request in a minute",
        icon: Rocket
      }
    ],
    aside: {
      title: "Open source",
      items: [
        { label: "GitHub", href: "/developers/github", icon: Github },
        {
          label: "Your first contribution",
          href: "/developers/github/first-contribution"
        },
        { label: "Data freshness", href: "/developers/freshness" },
        { label: "Status and limits", href: "/developers/status" }
      ]
    },
    footer: { label: "Developer docs", href: "/developers" }
  }
}
