"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Check, ChevronDown, Search, X } from "lucide-react"

import { reportError, track } from "@/lib/analytics"
import { formatShortDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"
import { usePathname } from "@/hooks/use-pathname"
import { replaceSearchParams, useSearchParams } from "@/hooks/use-search-params"
import { Button } from "@/components/ui/button"
import { cardVariants } from "@/components/ui/card"
import { InlineCode } from "@/components/ui/inline-code"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { ArticleThumb } from "@/components/articles/article-thumb"
import { SectionHeading } from "@/components/header"

export interface ArticleListItem {
  slug: string
  title: string
  description: string
  date: string
  category: string
  tags: string[]
  thumbnail: string
  thumbnailAlt: string
  thumbnailText: string
  readingTime: string
}

interface ArticlesListProps {
  articles: ArticleListItem[]
  categories: string[]
}

const ALL_CATEGORIES = "all"
const GROUP_BY_CATEGORY = "category"
const SORT_GROUPS: { heading: string; options: [string, string][] }[] = [
  {
    heading: "Date",
    options: [
      ["", "Newest"],
      ["oldest", "Oldest"]
    ]
  },
  {
    heading: "Views",
    options: [
      ["views", "Most viewed"],
      ["views-asc", "Least viewed"]
    ]
  }
]
const SORT_LABELS = Object.fromEntries(
  SORT_GROUPS.flatMap((group) => group.options)
)

const getCategoryParam = (category: string) =>
  category
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

const getSearchText = (article: ArticleListItem) =>
  [article.title, article.description, article.category, ...article.tags].join(
    " "
  )

function ArticleCard({
  article,
  showCategory,
  views,
  loading
}: {
  article: ArticleListItem
  showCategory: boolean
  views?: number
  loading: boolean
}) {
  return (
    <a
      href={`/articles/${article.slug}`}
      className={cn(
        cardVariants({ interactive: true }),
        "group flex flex-col overflow-hidden rounded-2xl"
      )}>
      <div className="relative">
        <ArticleThumb text={article.thumbnailText || article.title} />
        {/* Absolutely positioned, so the views arriving later cannot reflow the card. */}
        {views !== undefined ? (
          <span className="bg-foreground text-background absolute right-2 bottom-2 rounded px-1.5 py-0.5 text-xs">
            {views.toLocaleString("en-SG")} {views === 1 ? "view" : "views"}
          </span>
        ) : (
          loading && (
            // Same box as the pill, sized by its text, so nothing shifts when views arrive.
            <Skeleton
              aria-hidden="true"
              className="bg-foreground/15 absolute right-2 bottom-2 rounded px-1.5 py-0.5 text-xs text-transparent select-none">
              XX views
            </Skeleton>
          )
        )}
      </div>
      <div className="flex-1 p-4">
        <div className="text-muted-foreground flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
          <span>{formatShortDate(article.date)}</span>
          <span aria-hidden="true">·</span>
          <span>{article.readingTime}</span>
          {showCategory && (
            <>
              <span aria-hidden="true">·</span>
              <span className="bg-primary-subtle text-primary rounded px-1.5 py-0.5">
                {article.category}
              </span>
            </>
          )}
        </div>
        <h2 className="mt-2 line-clamp-2 font-semibold wrap-break-word transition-colors">
          {article.title}
        </h2>
        <p className="text-foreground mt-2 line-clamp-3 text-sm leading-6 wrap-break-word">
          {article.description}
        </p>
      </div>
    </a>
  )
}

export default function ArticlesList({
  articles,
  categories
}: ArticlesListProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)

  const queryParam = searchParams.get("q") ?? ""
  const categoryParam = searchParams.get("category") ?? ALL_CATEGORIES
  const groupParam = searchParams.get("group") ?? ""
  const rawSort = searchParams.get("sort") ?? ""
  const sortParam = Object.hasOwn(SORT_LABELS, rawSort) ? rawSort : ""
  const [views, setViews] = useState<Record<string, number>>()
  const [searchQuery, setSearchQuery] = useState(queryParam)
  const debouncedSearchQuery = useDebounce(searchQuery, 250)

  const activeCategory =
    categories.find(
      (category) => getCategoryParam(category) === categoryParam
    ) ?? ALL_CATEGORIES
  const activeCategoryParam =
    activeCategory === ALL_CATEGORIES
      ? ALL_CATEGORIES
      : getCategoryParam(activeCategory)

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())

      Object.entries(updates).forEach(([key, value]) => {
        if (!value) {
          params.delete(key)
        } else {
          params.set(key, value)
        }
      })

      replaceSearchParams(pathname, params.toString())
    },
    [pathname, searchParams]
  )

  useEffect(() => {
    fetch("/api/article-views")
      .then((res) => {
        if (!res.ok) throw new Error(`article-views ${res.status}`)
        return res.json()
      })
      .then((data) => setViews(data?.views ?? {}))
      .catch((e) => {
        reportError("article_views_fetch", e)
        setViews({}) // stop the skeletons
      })
  }, [])

  useEffect(() => {
    setSearchQuery(queryParam)
  }, [queryParam])

  useEffect(() => {
    const value = debouncedSearchQuery.trim()
    if (value === queryParam) return
    updateParams({ q: value || null })
    if (value) track("articles_searched", { search_term: value })
  }, [debouncedSearchQuery, queryParam, updateParams])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey) return

      const activeElement = document.activeElement
      if (
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement
      ) {
        return
      }

      event.preventDefault()
      inputRef.current?.focus()
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [])

  const hasSearch = queryParam.trim().length > 0
  const hasCategory = activeCategory !== ALL_CATEGORIES
  const hasGrouping = groupParam === GROUP_BY_CATEGORY
  const isGrouped = hasGrouping && !hasCategory
  const sortLabel = SORT_LABELS[sortParam]
  const hasSorting = sortParam !== ""
  const hasActiveFilters = hasSearch || hasCategory || hasGrouping || hasSorting

  const filteredArticles = useMemo(() => {
    const normalisedQuery = queryParam.trim().toLowerCase()

    const matches = articles.filter((article) => {
      const matchesCategory =
        activeCategory === ALL_CATEGORIES ||
        getCategoryParam(article.category) === activeCategoryParam
      const matchesSearch =
        !normalisedQuery ||
        getSearchText(article).toLowerCase().includes(normalisedQuery)

      return matchesCategory && matchesSearch
    })

    // Input is newest first and Array.sort is stable, so view ties stay newest first.
    if (sortParam === "oldest") return matches.reverse()
    if (sortParam.startsWith("views")) {
      const dir = sortParam === "views" ? -1 : 1
      return matches.sort(
        (a, b) => dir * ((views?.[a.slug] ?? 0) - (views?.[b.slug] ?? 0))
      )
    }
    return matches
  }, [
    activeCategory,
    activeCategoryParam,
    articles,
    queryParam,
    sortParam,
    views
  ])

  const shouldGroup = isGrouped

  const groupedArticles = useMemo(() => {
    if (!shouldGroup) return null
    const map = new Map<string, ArticleListItem[]>()
    for (const article of filteredArticles) {
      const group = map.get(article.category) ?? []
      group.push(article)
      map.set(article.category, group)
    }
    return categories
      .filter((cat) => map.has(cat))
      .map((cat) => ({ category: cat, articles: map.get(cat)! }))
  }, [shouldGroup, filteredArticles, categories])

  if (articles.length === 0) {
    return (
      <div
        className={cn(
          cardVariants(),
          "text-foreground rounded-2xl p-4 text-sm wrap-break-word sm:p-6"
        )}>
        No articles published yet. Copy{" "}
        <InlineCode>content/articles/_template.md</InlineCode> into the same
        folder without the leading underscore to publish one.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            ref={inputRef}
            className={cn("pl-9", hasSearch && "ring-ring rounded-md ring-1")}
            placeholder="Search articles…"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-between sm:w-44",
                hasSorting && "ring-ring rounded-md ring-1"
              )}>
              <span className="truncate">{sortLabel}</span>
              <ChevronDown className="size-4 opacity-60" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-48 p-1">
            {SORT_GROUPS.map(({ heading, options }) => (
              <div key={heading}>
                <p className="text-muted-foreground px-2 pt-1.5 pb-1 text-xs font-medium">
                  {heading}
                </p>
                {options.map(([value, label]) => (
                  <PopoverClose
                    key={label}
                    className="hover:bg-accent flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors"
                    onClick={() => updateParams({ sort: value || null })}>
                    <Check
                      className={cn(
                        "size-4",
                        sortParam === value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate">{label}</span>
                  </PopoverClose>
                ))}
              </div>
            ))}
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-between sm:w-44",
                hasGrouping && "ring-ring rounded-md ring-1"
              )}>
              <span className="truncate">
                {hasGrouping ? "Category" : "No Grouping"}
              </span>
              <ChevronDown className="size-4 opacity-60" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-48 p-1">
            {(
              [
                ["", "None"],
                [GROUP_BY_CATEGORY, "Category"]
              ] as const
            ).map(([value, label]) => {
              const isSelected = groupParam === value
              return (
                <PopoverClose
                  key={label}
                  className="hover:bg-accent flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors"
                  onClick={() => updateParams({ group: value || null })}>
                  <Check
                    className={cn(
                      "size-4",
                      isSelected ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{label}</span>
                </PopoverClose>
              )
            })}
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-between sm:w-48",
                hasCategory && "ring-ring rounded-md ring-1"
              )}>
              <span className="truncate">
                {hasCategory ? activeCategory : "All categories"}
              </span>
              <ChevronDown className="size-4 opacity-60" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-64 p-1">
            {[ALL_CATEGORIES, ...categories].map((category) => {
              const isAll = category === ALL_CATEGORIES
              const label = isAll ? "All categories" : category
              const value = isAll ? null : getCategoryParam(category)
              const isSelected = isAll
                ? !hasCategory
                : getCategoryParam(category) === activeCategoryParam

              return (
                <PopoverClose
                  key={category}
                  className="hover:bg-accent flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors"
                  onClick={() => {
                    updateParams({ category: value })
                    if (value)
                      track("articles_category_filtered", {
                        category
                      })
                  }}>
                  <Check
                    className={cn(
                      "size-4",
                      isSelected ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{label}</span>
                </PopoverClose>
              )
            })}
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex min-h-6 flex-wrap items-center justify-between gap-2">
        <p className="text-muted-foreground text-sm">
          {filteredArticles.length}{" "}
          {filteredArticles.length === 1 ? "article" : "articles"}
        </p>

        {hasActiveFilters && (
          <div className="flex flex-wrap justify-end gap-2">
            {hasSearch && (
              <Button
                variant="secondary"
                size="xs"
                onClick={() => {
                  setSearchQuery("")
                  updateParams({ q: null })
                }}>
                <span>&quot;{queryParam}&quot;</span>
                <X className="size-3" />
              </Button>
            )}
            {hasSorting && (
              <Button
                variant="secondary"
                size="xs"
                onClick={() => updateParams({ sort: null })}>
                Sort: {sortLabel}
                <X className="size-3" />
              </Button>
            )}
            {hasGrouping && (
              <Button
                variant="secondary"
                size="xs"
                onClick={() => updateParams({ group: null })}>
                Group: Category
                <X className="size-3" />
              </Button>
            )}
            {hasCategory && (
              <Button
                variant="secondary"
                size="xs"
                onClick={() => updateParams({ category: null })}>
                {activeCategory}
                <X className="size-3" />
              </Button>
            )}
          </div>
        )}
      </div>

      {filteredArticles.length > 0 ? (
        shouldGroup && groupedArticles ? (
          <div className="space-y-8">
            {groupedArticles.map(({ category, articles: groupArticles }) => (
              <section key={category}>
                <SectionHeading className="mb-3">{category}</SectionHeading>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {groupArticles.map((article) => (
                    <ArticleCard
                      key={article.slug}
                      article={article}
                      showCategory={false}
                      views={views?.[article.slug]}
                      loading={views === undefined}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filteredArticles.map((article) => (
              <ArticleCard
                key={article.slug}
                article={article}
                showCategory={!hasCategory}
                views={views?.[article.slug]}
                loading={views === undefined}
              />
            ))}
          </div>
        )
      ) : (
        <div
          className={cn(
            cardVariants(),
            "text-foreground rounded-2xl p-4 text-sm wrap-break-word sm:p-6"
          )}>
          No articles match those filters.
        </div>
      )}
    </div>
  )
}
