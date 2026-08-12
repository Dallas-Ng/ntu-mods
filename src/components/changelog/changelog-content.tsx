"use client"

import { useState } from "react"

import {
  CHANGELOG,
  type ChangelogCategory,
  type ChangelogItem,
  type ChangelogRelease
} from "@/config/changelog-data"
import { cn } from "@/lib/utils"
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
    "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-900 dark:bg-fuchsia-950 dark:text-fuchsia-300",
  Data: "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-300",
  Performance:
    "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950 dark:text-cyan-300",
  Feedback:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300"
}

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
          "inline-flex h-6 w-fit cursor-pointer items-center rounded-full border px-2 text-xs leading-none font-medium transition-opacity hover:opacity-80",
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
    <thead>
      <tr>
        <th className="bg-muted/50 text-muted-foreground w-28 border px-3 py-1.5 text-center text-xs font-medium tracking-wide">
          Type
        </th>
        <th className="bg-muted/50 text-muted-foreground border px-2 py-1.5 text-xs font-medium tracking-wide">
          Description
        </th>
      </tr>
    </thead>
    <tbody>
      {items.map((item, i) => (
        <tr key={i} className="align-top">
          <td className="w-28 border py-1.5 pr-3 text-center">
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
    <div className="space-y-0.5">
      <h2 className="text-xl font-semibold">{release.title}</h2>
      <p className="text-muted-foreground text-sm">{release.date}</p>
    </div>

    {release.note && (
      <p className="text-muted-foreground bg-primary/10 border-primary/20 rounded-lg border px-3 py-2 text-sm">
        {release.note}
      </p>
    )}

    <ChangelogTable items={release.items} />
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

export default ChangelogContent
