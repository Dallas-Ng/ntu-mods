"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Check, ChevronDown, Search, X } from "lucide-react"

import { cn } from "@/lib/utils"
import { useDebounce } from "@/hooks/use-debounce"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover"

export interface ArticleListItem {
  slug: string
  title: string
  description: string
  date: string
  category: string
  tags: string[]
  thumbnail: string
  thumbnailAlt: string
  readingTime: string
}

interface ArticlesListProps {
  articles: ArticleListItem[]
  categories: string[]
}

const ALL_CATEGORIES = "all"
const GROUP_BY_CATEGORY = "category"

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

const formatArticleDate = (date: string) =>
  new Date(date).toLocaleDateString("en-SG", {
    day: "numeric",
    month: "short",
    year: "numeric"
  })

function ArticleCard({
  article,
  showCategory
}: {
  article: ArticleListItem
  showCategory: boolean
}) {
  return (
    <Link
      href={`/articles/${article.slug}`}
      className="group bg-card hover:bg-accent rounded-md border transition-colors">
      {article.thumbnail && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.thumbnail}
          alt={article.thumbnailAlt}
          className="aspect-video w-full rounded-t-md border-b object-cover"
        />
      )}
      <div className="p-4">
        <div className="text-foreground/70 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs">
          <span>{formatArticleDate(article.date)}</span>
          <span aria-hidden="true">·</span>
          <span>{article.readingTime}</span>
          {showCategory && (
            <>
              <span aria-hidden="true">·</span>
              <span className="bg-muted text-muted-foreground rounded px-1.5 py-0.5">
                {article.category}
              </span>
            </>
          )}
        </div>
        <h2 className="group-hover:text-primary mt-2 line-clamp-2 font-semibold wrap-break-word">
          {article.title}
        </h2>
        <p className="text-foreground/80 mt-2 line-clamp-3 text-sm leading-6 wrap-break-word">
          {article.description}
        </p>
      </div>
    </Link>
  )
}

export default function ArticlesList({
  articles,
  categories
}: ArticlesListProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const inputRef = useRef<HTMLInputElement>(null)

  const queryParam = searchParams.get("q") ?? ""
  const categoryParam = searchParams.get("category") ?? ALL_CATEGORIES
  const groupParam = searchParams.get("group") ?? ""
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

      const nextQuery = params.toString()
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, {
        scroll: false
      })
    },
    [pathname, router, searchParams]
  )

  useEffect(() => {
    setSearchQuery(queryParam)
  }, [queryParam])

  useEffect(() => {
    const value = debouncedSearchQuery.trim()
    if (value === queryParam) return
    updateParams({ q: value || null })
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
  const isGrouped = groupParam === GROUP_BY_CATEGORY && !hasCategory
  const hasActiveFilters = hasSearch || hasCategory || isGrouped

  const filteredArticles = useMemo(() => {
    const normalisedQuery = queryParam.trim().toLowerCase()

    return articles.filter((article) => {
      const matchesCategory =
        activeCategory === ALL_CATEGORIES ||
        getCategoryParam(article.category) === activeCategoryParam
      const matchesSearch =
        !normalisedQuery ||
        getSearchText(article).toLowerCase().includes(normalisedQuery)

      return matchesCategory && matchesSearch
    })
  }, [activeCategory, activeCategoryParam, articles, queryParam])

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
      <div className="bg-card text-foreground/80 rounded-md border p-4 text-sm wrap-break-word sm:p-6">
        No articles published yet. Copy{" "}
        <code className="bg-muted rounded px-1 py-0.5">
          content/articles/_template.md
        </code>{" "}
        into the same folder without the leading underscore to publish one.
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
                isGrouped && "ring-ring rounded-md ring-1"
              )}>
              <span className="truncate">
                {isGrouped ? "Group: Category" : "No Grouping"}
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
                <button
                  key={label}
                  type="button"
                  className="hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors"
                  onClick={() => updateParams({ group: value || null })}>
                  <Check
                    className={cn(
                      "size-4",
                      isSelected ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{label}</span>
                </button>
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
                <button
                  key={category}
                  type="button"
                  className="hover:bg-accent flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors"
                  onClick={() => updateParams({ category: value })}>
                  <Check
                    className={cn(
                      "size-4",
                      isSelected ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{label}</span>
                </button>
              )
            })}
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">
          {filteredArticles.length}{" "}
          {filteredArticles.length === 1 ? "article" : "articles"}
        </p>

        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
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
            {isGrouped && (
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
                <h2 className="mb-4 text-lg font-semibold">{category}</h2>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {groupArticles.map((article) => (
                    <ArticleCard
                      key={article.slug}
                      article={article}
                      showCategory={false}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredArticles.map((article) => (
              <ArticleCard
                key={article.slug}
                article={article}
                showCategory={!hasCategory}
              />
            ))}
          </div>
        )
      ) : (
        <div className="bg-card text-foreground/80 rounded-md border p-4 text-sm wrap-break-word sm:p-6">
          No articles match those filters.
        </div>
      )}
    </div>
  )
}
