import Link from "next/link"

import { SUPPORT_PAGE_CONTAINER_CLASSNAME } from "@/lib/constants"
import { cn } from "@/lib/utils"
import Header from "@/components/header"

type ChangelogCategory =
  | "New Feature"
  | "Improvement"
  | "Bug Fix"
  | "Content"
  | "Data"
  | "Performance"

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
  Data:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300",
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

const CategoryBadge = ({ category }: { category: ChangelogCategory }) => (
  <span
    className={cn(
      "inline-flex h-6 w-fit items-center rounded-full border px-2 text-xs font-medium leading-none",
      CATEGORY_STYLES[category]
    )}>
    {category}
  </span>
)

const CategoryLegend = () => (
  <div className="flex flex-wrap gap-2">
    {CATEGORIES.map((category) => (
      <CategoryBadge key={category} category={category} />
    ))}
  </div>
)

const ChangelogTable = ({ items }: { items: ChangelogItem[] }) => (
  <table className="w-full border-collapse text-left text-sm text-muted-foreground">
    <tbody>
      {items.map((item, i) => (
        <tr key={i} className="align-top">
          <td className="w-28 py-1.5 pr-3">
            <CategoryBadge category={item.category} />
          </td>

          <td className="py-1.5 leading-6">{item.content}</td>
        </tr>
      ))}
    </tbody>
  </table>
)

const ChangelogReleaseCard = ({ release }: { release: ChangelogRelease }) => (
  <section className="space-y-4 rounded-md border bg-card p-4 shadow-sm">
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h2 className="text-xl font-semibold">{release.title}</h2>

      <p className="text-sm text-muted-foreground">{release.date}</p>
    </div>

    <ChangelogTable items={release.items} />
  </section>
)

const CHANGELOG: ChangelogRelease[] = [
  {
    title: "Better timetable planning",
    date: "Apr 2026",
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
    date: "Apr 2026",
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
    date: "Mar 2026",
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
            <ChangelogLink href="/help">help documentation</ChangelogLink> and
            FAQ content.
          </>
        )
      },
      {
        category: "New Feature",
        content: (
          <>
            Added{" "}
            <ChangelogLink href="/debug">debug and reset helpers</ChangelogLink>{" "}
            for recovering local timetable data.
          </>
        )
      }
    ]
  },
  {
    title: "Data, modules, and exams",
    date: "Mar 2026",
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
    date: "Mar 2026",
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
  }
]

export default function ChangelogPage() {
  return (
    <div className={cn(SUPPORT_PAGE_CONTAINER_CLASSNAME, "space-y-8")}>
      <div className="space-y-5">
        <Header
          title="Changelog"
          subtitle="A simple record of recent NTU Mods updates, fixes, and new features."
        />

        <CategoryLegend />
      </div>

      <div className="space-y-5">
        {CHANGELOG.map((release) => (
          <ChangelogReleaseCard key={release.title} release={release} />
        ))}
      </div>
    </div>
  )
}
