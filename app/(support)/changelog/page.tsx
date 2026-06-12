"use client"

import { useState } from "react"
import Link from "next/link"

import { cn } from "@/lib/utils"
import Container from "@/components/container"
import Header from "@/components/header"

type ChangelogCategory =
  | "New Feature"
  | "Improvement"
  | "Bug Fix"
  | "Content"
  | "Data"
  | "Performance"

type ChangelogFilter = ChangelogCategory | "All"

interface ChangelogItem {
  category: ChangelogCategory
  content: React.ReactNode
}

interface ChangelogRelease {
  title: string
  date: string
  items: ChangelogItem[]
}

const CATEGORY_STYLES: Record<ChangelogCategory, string> = {
  "New Feature":
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300",
  Improvement:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-300",
  "Bug Fix":
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-300",
  Content:
    "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-300",
  Data: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
  Performance:
    "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950 dark:text-cyan-300"
}

const ChangelogLink = ({
  href,
  children
}: {
  href: string
  children: React.ReactNode
}) => (
  <Link
    href={href}
    className="text-blue-500 transition-colors hover:text-blue-600">
    {children}
  </Link>
)

const CATEGORIES = Object.keys(CATEGORY_STYLES) as ChangelogCategory[]

const FILTERS = ["All", ...CATEGORIES] as ChangelogFilter[]

const getCategoryBadgeClassName = (category: ChangelogCategory) =>
  cn(
    "inline-flex h-6 w-fit items-center rounded-full border px-2 text-xs leading-none font-medium",
    CATEGORY_STYLES[category]
  )

const CategoryBadge = ({ category }: { category: ChangelogCategory }) => (
  <span className={getCategoryBadgeClassName(category)}>{category}</span>
)

const ChangelogFilters = ({
  activeFilter,
  onFilterChange
}: {
  activeFilter: ChangelogFilter
  onFilterChange: (filter: ChangelogFilter) => void
}) => (
  <div className="flex flex-wrap gap-2">
    {FILTERS.map((filter) => (
      <button
        key={filter}
        type="button"
        aria-pressed={activeFilter === filter}
        onClick={() => onFilterChange(filter)}
        className={cn(
          "inline-flex h-6 w-fit items-center rounded-full border px-2 text-xs leading-none font-medium transition-opacity hover:opacity-80",
          activeFilter !== filter && "opacity-50",
          filter === "All"
            ? "border-border bg-muted text-foreground"
            : CATEGORY_STYLES[filter]
        )}>
        {filter}
      </button>
    ))}
  </div>
)

const ChangelogTable = ({ items }: { items: ChangelogItem[] }) => (
  <table className="text-muted-foreground w-full border-collapse text-left text-sm">
    <tbody>
      {items.map((item, i) => (
        <tr key={i} className="align-top">
          <td className="w-28 border py-1.5 pr-3">
            <CategoryBadge category={item.category} />
          </td>

          <td className="border py-1.5 leading-6">{item.content}</td>
        </tr>
      ))}
    </tbody>
  </table>
)

const ChangelogReleaseSection = ({
  release
}: {
  release: ChangelogRelease
}) => (
  <section className="border-border space-y-4 border-t pt-6 first:border-t-0 first:pt-0">
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h2 className="text-xl font-semibold">{release.title}</h2>

      <p className="text-muted-foreground text-sm">{release.date}</p>
    </div>

    <ChangelogTable items={release.items} />
  </section>
)

const CHANGELOG: ChangelogRelease[] = [
  {
    title: "Timetable generator improvements",
    date: "12 Jun 2026",
    items: [
      {
        category: "New Feature",
        content: (
          <>
            Generate timetables from a{" "}
            <ChangelogLink href="/timetable">
              comma-separated list of module codes
            </ChangelogLink>{" "}
            — paste them all at once instead of adding one by one. Requested by
            anonymous students.
          </>
        )
      },
      {
        category: "New Feature",
        content:
          "Lock a specific index for any module before generating — the generator will only consider that registration group. Requested by anonymous students."
      },
      {
        category: "New Feature",
        content:
          'Hide duplicate timetable results that share identical timeslots but differ only by index number. Toggle "Hide same-timeslot duplicates" in the results panel. Requested by anonymous students.'
      },
      {
        category: "New Feature",
        content: (
          <>
            <ChangelogLink href="/mods">Module pages</ChangelogLink> now include
            an interactive prerequisite graph so you can visualise dependency
            chains at a glance. Requested by anonymous students.
          </>
        )
      },
      {
        category: "Improvement",
        content:
          "When generation finds no results, the tool now analyses your constraints and suggests the specific setting to relax — instead of a generic error message."
      },
      {
        category: "Improvement",
        content: "Duplicate plan option added to the plan actions dropdown."
      },
      {
        category: "Bug Fix",
        content:
          "Fixed module search input resetting mid-type after the debounce fired."
      }
    ]
  },
  {
    title: "AY 2026 Semester 1 now available",
    date: "29 May 2026",
    items: [
      {
        category: "Data",
        content: (
          <>
            AY 2026 Semester 1 course data is now live — 1,126 courses and 4,842
            indexes available in the{" "}
            <ChangelogLink href="/timetable">timetable</ChangelogLink> and{" "}
            <ChangelogLink href="/mods">module browser</ChangelogLink>.
          </>
        )
      },
      {
        category: "New Feature",
        content:
          "Current semester now shown prominently in the navbar and footer."
      },
      {
        category: "Improvement",
        content: (
          <>
            Moved <ChangelogLink href="/faq">Help to /faq</ChangelogLink> with a
            table of contents for quicker navigation.
          </>
        )
      }
    ]
  },
  {
    title: "Articles search, categories, and new guides",
    date: "22 May 2026",
    items: [
      {
        category: "New Feature",
        content: (
          <>
            Added a search bar and category filter to the{" "}
            <ChangelogLink href="/articles">Articles</ChangelogLink> page.
          </>
        )
      },
      {
        category: "New Feature",
        content: (
          <>
            Added{" "}
            <ChangelogLink href="/articles">
              article category pages
            </ChangelogLink>{" "}
            for browsing guides by topic.
          </>
        )
      },
      {
        category: "Improvement",
        content: (
          <>
            Articles now grouped by category in the default{" "}
            <ChangelogLink href="/articles">list view</ChangelogLink>.
          </>
        )
      },
      {
        category: "Content",
        content: (
          <>
            Published 4 new guides:{" "}
            <ChangelogLink href="/articles/complete-ntu-bde-list">
              complete NTU BDE list
            </ChangelogLink>
            ,{" "}
            <ChangelogLink href="/articles/best-cc-modules-ntu">
              best CC modules
            </ChangelogLink>
            ,{" "}
            <ChangelogLink href="/articles/ntu-module-selection-guide">
              module selection guide
            </ChangelogLink>
            , and{" "}
            <ChangelogLink href="/articles/does-bde-count-towards-degree-ntu">
              whether BDEs count toward your degree
            </ChangelogLink>
            .
          </>
        )
      },
      {
        category: "Bug Fix",
        content: (
          <>
            Fixed a navigation error when browsing{" "}
            <ChangelogLink href="/articles">articles</ChangelogLink> by
            category.
          </>
        )
      }
    ]
  },
  {
    title: "Resources dropdown and mobile navigation",
    date: "21 May 2026",
    items: [
      {
        category: "Improvement",
        content:
          "Replaced the Help link in the navbar with a Resources dropdown grouping Changelog, FAQ, and Sitemap."
      },
      {
        category: "Improvement",
        content:
          "Redesigned mobile navigation with a right-side drawer for easier access."
      },
      {
        category: "Bug Fix",
        content:
          "Fixed timetable onboarding modal not dismissing after initial setup."
      }
    ]
  },
  {
    title: "Timetable modes and index picking",
    date: "21 May 2026",
    items: [
      {
        category: "Improvement",
        content: (
          <>
            Improved index picker focus on the{" "}
            <ChangelogLink href="/timetable">timetable</ChangelogLink>: other
            modules dim heavily when picking, alternate indexes are clearly
            highlighted, and selecting resets immediately for the next pick.
          </>
        )
      },
      {
        category: "New Feature",
        content: (
          <>
            Consolidated screenshot, calendar export, and share into a single{" "}
            <ChangelogLink href="/timetable">timetable</ChangelogLink> actions
            dropdown (•••).
          </>
        )
      },
      {
        category: "New Feature",
        content: (
          <>
            Added a mode selector to the{" "}
            <ChangelogLink href="/timetable">timetable</ChangelogLink> —
            Timetable, Generate, and AI modes (generation and AI coming soon).
          </>
        )
      }
    ]
  },
  {
    title: "More BDE guides and navigation",
    date: "20 May 2026",
    items: [
      {
        category: "Content",
        content: (
          <>
            Published 6 new BDE guides covering engineering BDEs, BDE vs minor,
            easy BDEs, bidding, language BDEs, and an expanded overview — all in{" "}
            <ChangelogLink href="/articles">Articles</ChangelogLink>.
          </>
        )
      },
      {
        category: "New Feature",
        content: (
          <>
            Added a <ChangelogLink href="/sitemap">Sitemap</ChangelogLink> page
            listing all pages on the site.
          </>
        )
      },
      {
        category: "Improvement",
        content: "Updated footer with better interlinks across site sections."
      }
    ]
  },
  {
    title: "Better timetable planning",
    date: "29 Apr 2026",
    items: [
      {
        category: "New Feature",
        content: (
          <>
            Added click-to-switch index previews so you can compare class groups
            directly from the{" "}
            <ChangelogLink href="/timetable">timetable</ChangelogLink>.
          </>
        )
      },
      {
        category: "Bug Fix",
        content: (
          <>
            Improved filtering behavior when browsing and selecting indexes in
            the <ChangelogLink href="/mods">module browser</ChangelogLink>.
          </>
        )
      },
      {
        category: "Improvement",
        content: (
          <>
            Polished mobile responsiveness and visual styling across{" "}
            <ChangelogLink href="/timetable">timetable views</ChangelogLink>.
          </>
        )
      }
    ]
  },
  {
    title: "Articles and planning guides",
    date: "29 Apr 2026",
    items: [
      {
        category: "New Feature",
        content: (
          <>
            Added an <ChangelogLink href="/articles">Articles</ChangelogLink>{" "}
            section for NTU module planning guides.
          </>
        )
      },
      {
        category: "Content",
        content: (
          <>
            Published guides for{" "}
            <ChangelogLink href="/articles/ntu-cc-modules-what-they-actually-feel-like">
              common curriculum modules
            </ChangelogLink>
            ,{" "}
            <ChangelogLink href="/articles/what-is-a-bde-at-ntu">
              BDE planning
            </ChangelogLink>
            , and{" "}
            <ChangelogLink href="/articles/most-popular-bdes-at-ntu">
              popular BDE choices
            </ChangelogLink>
            .
          </>
        )
      },
      {
        category: "Improvement",
        content: (
          <>
            Added supporting article navigation and reader-friendly{" "}
            <ChangelogLink href="/articles">page layouts</ChangelogLink>.
          </>
        )
      }
    ]
  },
  {
    title: "Feedback and support",
    date: "22 Mar 2026",
    items: [
      {
        category: "Improvement",
        content: (
          <>
            Updated{" "}
            <ChangelogLink href="/settings#feedback">
              feedback submissions
            </ChangelogLink>{" "}
            so reports can be sent by email.
          </>
        )
      },
      {
        category: "Content",
        content: (
          <>
            Expanded{" "}
            <ChangelogLink href="/faq">FAQ documentation</ChangelogLink> and
            help content.
          </>
        )
      }
    ]
  },
  {
    title: "Data, modules, and exams",
    date: "8 Mar 2026",
    items: [
      {
        category: "Improvement",
        content: (
          <>
            Moved <ChangelogLink href="/mods">module browsing</ChangelogLink>{" "}
            and module detail pages onto API-backed data routes.
          </>
        )
      },
      {
        category: "Data",
        content: (
          <>
            Added exam schedule data where available on{" "}
            <ChangelogLink href="/mods">module pages</ChangelogLink>.
          </>
        )
      },
      {
        category: "Improvement",
        content:
          "Simplified semester navigation and derive the latest semester from available data."
      },
      {
        category: "Data",
        content: "Cleaned up older data files and refreshed module/index data."
      }
    ]
  },
  {
    title: "Sharing and exports",
    date: "22 Mar 2026",
    items: [
      {
        category: "Bug Fix",
        content: (
          <>
            Fixed{" "}
            <ChangelogLink href="/timetable">timetable sharing</ChangelogLink>{" "}
            behavior and share button handling.
          </>
        )
      },
      {
        category: "Bug Fix",
        content: (
          <>
            Re-enabled calendar export support from the{" "}
            <ChangelogLink href="/timetable">timetable</ChangelogLink> after
            compatibility fixes.
          </>
        )
      },
      {
        category: "Performance",
        content:
          "Improved static data delivery to reduce serverless function usage."
      }
    ]
  },
  {
    title: "Multi-semester support",
    date: "21 Feb 2026",
    items: [
      {
        category: "New Feature",
        content: (
          <>
            Added multi-year and multi-semester support — browse modules and
            plan timetables across different academic years and semesters in the{" "}
            <ChangelogLink href="/mods">module browser</ChangelogLink>.
          </>
        )
      },
      {
        category: "Improvement",
        content:
          "Current academic year and semester now shown in the page header with no layout shift."
      }
    ]
  },
  {
    title: "AY 2024/2025 data",
    date: "9 Jun 2024",
    items: [
      {
        category: "Data",
        content: (
          <>
            AY 2024/2025 course data added — all modules and indexes available
            in the <ChangelogLink href="/timetable">timetable</ChangelogLink>{" "}
            and <ChangelogLink href="/mods">module browser</ChangelogLink>.
          </>
        )
      }
    ]
  },
  {
    title: "Workload info and module filtering",
    date: "30 Mar 2024",
    items: [
      {
        category: "New Feature",
        content: (
          <>
            Added a workload breakdown table to each{" "}
            <ChangelogLink href="/mods">module page</ChangelogLink> showing
            lecture, tutorial, lab, and project hours.
          </>
        )
      },
      {
        category: "New Feature",
        content: (
          <>
            Added module level filtering (1000–4000+) to the{" "}
            <ChangelogLink href="/mods">module browser</ChangelogLink>.
          </>
        )
      }
    ]
  },
  {
    title: "Timetable sharing",
    date: "19 Dec 2023",
    items: [
      {
        category: "New Feature",
        content: (
          <>
            Share your{" "}
            <ChangelogLink href="/timetable">timetable</ChangelogLink> with
            friends via a link.
          </>
        )
      },
      {
        category: "Improvement",
        content:
          "Indexes are now assigned without clashes automatically when picking modules."
      }
    ]
  }
]

export default function ChangelogPage() {
  const [activeFilter, setActiveFilter] = useState<ChangelogFilter>("All")

  const filteredChangelog = CHANGELOG.map((release) => ({
    ...release,
    items:
      activeFilter === "All"
        ? release.items
        : release.items.filter((item) => item.category === activeFilter)
  })).filter((release) => release.items.length > 0)

  return (
    <Container size="sm" className="space-y-8">
      <div className="space-y-5">
        <Header
          title="Changelog"
          subtitle="A simple record of recent NTU Mods updates, fixes, and new features."
        />

        <ChangelogFilters
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
      </div>

      <div className="space-y-6">
        {filteredChangelog.map((release) => (
          <ChangelogReleaseSection key={release.title} release={release} />
        ))}
      </div>
    </Container>
  )
}
