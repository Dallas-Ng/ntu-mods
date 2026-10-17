"use client"

import { useState } from "react"

import {
  CHANGELOG,
  type ChangelogCategory,
  type ChangelogItem,
  type ChangelogRelease
} from "@/config/changelog-data"
import { cn } from "@/lib/utils"

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

const ChangelogReleaseSection = ({
  release
}: {
  release: ChangelogRelease
}) => (
  <section className="bg-muted rounded-2xl p-5 md:p-6">
    <p className="text-foreground/75 text-sm">{release.date}</p>
    <h2 className="mt-1 text-xl font-semibold">{release.title}</h2>

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
          <span className="text-foreground/80 text-sm leading-6 md:text-base">
            {item.content}
          </span>
        </li>
      ))}
    </ul>
  </section>
)

const ChangelogContent = () => {
  const [activeFilter, setActiveFilter] = useState<ChangelogFilter>("All")

  const filteredChangelog = CHANGELOG.map((release) => ({
    ...release,
    items:
      activeFilter === "All"
        ? release.items
        : release.items.filter((item) => item.category === activeFilter)
  })).filter((release) => release.items.length > 0)

  return (
    <div className="mx-auto max-w-3xl px-4 pb-12 md:pb-20">
      <div className="mb-8 space-y-5 md:mb-10">
        <div>
          <h1 className="text-3xl leading-[1] font-semibold">Changelog</h1>
          <p className="text-muted-foreground mt-3">
            A simple record of recent NTU Mods updates, fixes, and new features.
          </p>
        </div>

        <ChangelogFilters
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
      </div>

      <div className="space-y-3">
        {filteredChangelog.map((release) => (
          <ChangelogReleaseSection key={release.title} release={release} />
        ))}
      </div>
    </div>
  )
}

export default ChangelogContent
