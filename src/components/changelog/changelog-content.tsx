"use client"

import { useMemo, useState } from "react"
import { ArrowUp, Link as LinkIcon } from "lucide-react"

import {
  CHANGELOG,
  type ChangelogCategory,
  type ChangelogRelease
} from "@/config/changelog-data"
import { cn } from "@/lib/utils"
import { UNSEEN_CHANGELOG_IDS } from "@/hooks/use-changelog-unseen"
import { useHydrated } from "@/hooks/use-hydrated"
import ArticleToc, {
  MobileSectionDropdown
} from "@/components/articles/article-toc"
import Container from "@/components/container"
import Header from "@/components/header"

type ChangelogFilter = ChangelogCategory | "All"

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

const CATEGORIES = Object.keys(CATEGORY_STYLES) as ChangelogCategory[]

const FILTERS = ["All", ...CATEGORIES] as ChangelogFilter[]

const getCategoryBadgeClassName = (category: ChangelogCategory) =>
  cn(
    "inline-flex h-6 w-fit items-center whitespace-nowrap rounded-full border px-2 text-xs leading-none font-medium",
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
          "inline-flex h-6 w-fit cursor-pointer items-center rounded-full border px-2 text-xs leading-none font-medium transition-opacity hover:opacity-80",
          activeFilter === filter && "ring-ring ring-2 ring-offset-1",
          filter === "All"
            ? "border-border bg-muted text-foreground"
            : CATEGORY_STYLES[filter]
        )}>
        {filter}
      </button>
    ))}
  </div>
)

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec"
]

// "Landing page redesign" + "17 Oct 2026" -> "landing-page-redesign-2026-10-17"
const getReleaseSlug = ({ title, date }: ChangelogRelease) => {
  const [day, month, year] = date.split(" ")
  const monthNumber = String(MONTHS.indexOf(month.slice(0, 3)) + 1).padStart(
    2,
    "0"
  )
  const titleSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

  return `${titleSlug}-${year}-${monthNumber}-${day.padStart(2, "0")}`
}

const ChangelogReleaseSection = ({
  release,
  isUnseen
}: {
  release: ChangelogRelease
  isUnseen: boolean
}) => {
  const slug = getReleaseSlug(release)

  return (
    <section
      id={slug}
      className="bg-muted relative scroll-mt-32 rounded-2xl p-5 md:p-6 lg:scroll-mt-20">
      {isUnseen && (
        <span className="absolute top-4 right-4 rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-semibold text-black md:top-6 md:right-6">
          New
        </span>
      )}
      <p className="text-foreground/75 text-sm">{release.date}</p>
      <h2 className="mt-1 text-xl font-semibold">
        <a
          href={`#${slug}`}
          className="group/link inline-flex items-center gap-2 hover:underline hover:underline-offset-4">
          {release.title}
          <LinkIcon
            aria-hidden="true"
            className="text-muted-foreground size-4 opacity-0 transition-opacity group-hover/link:opacity-100 group-focus-visible/link:opacity-100"
          />
        </a>
      </h2>

      {release.note && (
        <p className="bg-background mt-4 rounded-lg px-3 py-2 text-sm">
          {release.note}
        </p>
      )}

      <ul className="divide-border mt-4 divide-y">
        {release.items.map((item, i) => (
          <li
            key={i}
            className="flex flex-col items-start gap-2 py-3 first:pt-0 last:pb-0 md:flex-row md:gap-4">
            <span className="md:w-32 md:shrink-0 md:pt-0.5">
              <CategoryBadge category={item.category} />
            </span>
            <span className="text-muted-foreground text-sm leading-6">
              {item.content}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

// "17 Oct 2026" -> { id: "q4-2026", label: "Q4 2026", order: 20264 }.
// Parsed from the string rather than via Date so server and browser agree
// regardless of timezone.
const getQuarter = (date: string) => {
  const [, month, year] = date.split(" ")
  const quarter = Math.floor(MONTHS.indexOf(month.slice(0, 3)) / 3) + 1

  return {
    id: `q${quarter}-${year}`,
    label: `Q${quarter} ${year}`,
    order: Number(year) * 10 + quarter
  }
}

const ChangelogContent = () => {
  const [activeFilter, setActiveFilter] = useState<ChangelogFilter>("All")
  // Unseen state is client-only, so the badges wait for hydration to avoid a mismatch.
  const hydrated = useHydrated()

  // Memoised so the section nav gets a stable `headings` between renders and
  // does not re-attach its scroll listeners on every filter click.
  const { sortedQuarters, headings } = useMemo(() => {
    const filteredChangelog = CHANGELOG.map((release) => ({
      ...release,
      items:
        activeFilter === "All"
          ? release.items
          : release.items.filter((item) => item.category === activeFilter)
    })).filter((release) => release.items.length > 0)

    const quarters = new Map<
      string,
      { id: string; label: string; order: number; releases: ChangelogRelease[] }
    >()

    for (const release of filteredChangelog) {
      const quarter = getQuarter(release.date)
      const group = quarters.get(quarter.id) ?? { ...quarter, releases: [] }
      group.releases.push(release)
      quarters.set(quarter.id, group)
    }

    const sortedQuarters = [...quarters.values()].sort(
      (a, b) => b.order - a.order
    )

    return {
      sortedQuarters,
      headings: sortedQuarters.map(({ id, label, releases }) => ({
        id,
        depth: 2,
        text: label,
        group: label.split(" ")[1],
        count: releases.length
      }))
    }
  }, [activeFilter])

  return (
    <Container size="md">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,48rem)_16rem] [&>*]:min-w-0">
        <div className="space-y-8">
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

          <MobileSectionDropdown headings={headings} />

          <div className="space-y-8">
            {sortedQuarters.map(({ id, label, releases }) => (
              <section key={id} id={id} className="scroll-mt-20 space-y-3">
                <h2 className="text-xl font-semibold">
                  {label}{" "}
                  <span className="text-muted-foreground text-sm font-normal">
                    {releases.length}{" "}
                    {releases.length === 1 ? "update" : "updates"}
                  </span>
                </h2>

                {releases.map((release) => (
                  <ChangelogReleaseSection
                    key={release.id}
                    release={release}
                    isUnseen={hydrated && UNSEEN_CHANGELOG_IDS.has(release.id)}
                  />
                ))}
              </section>
            ))}

            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="text-muted-foreground hover:text-foreground inline-flex cursor-pointer items-center gap-1.5 text-sm transition-colors">
              <ArrowUp className="size-4" />
              Back to the latest updates
            </button>
          </div>
        </div>

        <ArticleToc headings={headings} />
      </div>
    </Container>
  )
}

export default ChangelogContent
