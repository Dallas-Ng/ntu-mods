"use client"

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { ChevronDown, LayoutGrid, List, SlidersHorizontal } from "lucide-react"

import { MODULE_CATEGORY, MODULE_FACULTY } from "@/lib/constants"
import { getModuleCategories } from "@/lib/get-module-category"
import { getModuleFaculty } from "@/lib/get-module-faculty"
import { useAllModules, type AllModule } from "@/hooks/use-all-modules"
import { useLatestSemester } from "@/hooks/use-latest-semester"
import { useSettings } from "@/hooks/use-settings"
import { Button } from "@/components/ui/button"
import Header from "@/components/header"
import { ModsActiveFilters } from "@/components/mods/mods-active-filters"
import { ModsCurrentOnlyToggle } from "@/components/mods/mods-current-only-toggle"
import ModsEmptyCard from "@/components/mods/mods-empty-card"
import {
  ModsFacultySelect,
  SearchModuleFaculty
} from "@/components/mods/mods-faculty-select"
import {
  ModsGroupBySelect,
  type ModsGroupBy
} from "@/components/mods/mods-group-by-select"
import {
  ModsLevelSelect,
  SearchModuleLevel
} from "@/components/mods/mods-module-level-select"
import {
  ModsModuleTypeSelect,
  SearchModuleType
} from "@/components/mods/mods-module-type-select"
import ModsSearchInput from "@/components/mods/mods-search-input"
import { Semester } from "@/components/mods/mods-semester-select"
import {
  ModuleCardDetail,
  ModuleCardDetailLoading,
  ModuleListRow,
  ModuleListRowLoading
} from "@/components/module-card"

interface Props {
  searchParams: Promise<{
    searchTerm?: string
    semester?: Semester
    moduleType?: SearchModuleType
    moduleFaculty?: SearchModuleFaculty
    moduleLevel?: SearchModuleLevel
    currentOnly?: string
  }>
}

const PAGE_SIZE = 100
const GROUP_DEFAULT_VISIBLE = 10
const LOADING_CARD_COUNT = 9
const LOADING_LIST_COUNT = 12
const CODE_QUERY_RE = /^[a-z]{2,4}\d*/i
const TYPE_PRIORITY: ModuleType[] = [
  "CNY",
  "USP",
  "GERP",
  "MLOAD",
  "GLOAD",
  "CORE"
]

function getGroupKey(module: AllModule, groupBy: ModsGroupBy): string {
  switch (groupBy) {
    case "level":
      return module.code.slice(2, 3)
    case "au":
      return module.au ?? "?"
    case "faculty":
      return getModuleFaculty(module.code, module.searchKeys ?? []) || "OTHER"
    case "type": {
      const cats = getModuleCategories(module.searchKeys ?? [])
      if (cats.length === 0) return "OTHER"
      return TYPE_PRIORITY.find((p) => cats.includes(p)) ?? cats[0]
    }
    default:
      return ""
  }
}

function getGroupLabel(key: string, groupBy: ModsGroupBy): string {
  switch (groupBy) {
    case "level":
      return `Level ${key}`
    case "au":
      return `${key} AU`
    case "faculty":
      return `${MODULE_FACULTY[key as ModuleFaculty] ?? key} (${key})`
    case "type":
      return MODULE_CATEGORY[key as ModuleType] ?? key
    default:
      return key
  }
}

function groupModules(modules: AllModule[], groupBy: ModsGroupBy) {
  const map = new Map<string, AllModule[]>()
  for (const m of modules) {
    const key = getGroupKey(m, groupBy)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(m)
  }
  const entries = Array.from(map.entries()).map(([key, mods]) => ({
    key,
    label: getGroupLabel(key, groupBy),
    modules: mods
  }))
  if (groupBy === "level" || groupBy === "au") {
    entries.sort((a, b) =>
      a.key.localeCompare(b.key, undefined, { numeric: true })
    )
  } else {
    entries.sort((a, b) => a.label.localeCompare(b.label))
  }
  return entries
}

function filterModules(
  modules: AllModule[],
  opts: {
    searchTerm: string
    moduleType: string
    moduleFaculty: string
    moduleLevel: string
    currentOnly: boolean
  }
): AllModule[] {
  let filtered = modules

  if (opts.currentOnly) {
    filtered = filtered.filter((m) => m.isCurrentSemester)
  }

  if (opts.moduleType !== "all") {
    filtered = filtered.filter((m) =>
      getModuleCategories(m.searchKeys ?? []).includes(
        opts.moduleType as ModuleType
      )
    )
  }

  if (opts.moduleFaculty !== "all") {
    filtered = filtered.filter(
      (m) => getModuleFaculty(m.code, m.searchKeys ?? []) === opts.moduleFaculty
    )
  }

  if (opts.moduleLevel !== "all") {
    filtered = filtered.filter((m) => m.code.slice(2, 3) === opts.moduleLevel)
  }

  if (opts.searchTerm) {
    const q = opts.searchTerm.toLowerCase()
    if (CODE_QUERY_RE.test(q)) {
      const codeMatches = filtered.filter((m) =>
        m.code.toLowerCase().includes(q)
      )
      const titleMatches = filtered.filter(
        (m) =>
          !m.code.toLowerCase().includes(q) && m.title.toLowerCase().includes(q)
      )
      filtered = [...codeMatches, ...titleMatches]
    } else {
      filtered = filtered.filter(
        (m) =>
          m.title.toLowerCase().includes(q) || m.code.toLowerCase().includes(q)
      )
    }
  }

  return filtered
}

const ModsPage = (props: Props) => {
  const searchParams = use(props.searchParams)
  const {
    searchTerm = "",
    moduleType = "all",
    moduleFaculty = "all",
    moduleLevel = "all",
    currentOnly = "true"
  } = searchParams

  const { year, semester } = useLatestSemester()
  const nextYear = parseInt(year) + 1
  const { modules: allModules, isLoading } = useAllModules()
  const { modsViewMode, modsGroupBy, updateSettings } = useSettings()
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [filtersOpen, setFiltersOpen] = useState(true)
  const loaderRef = useRef<HTMLDivElement>(null)

  const activeFilterCount = [
    moduleType !== "all",
    moduleFaculty !== "all",
    moduleLevel !== "all",
    true
  ].filter(Boolean).length

  const setViewMode = useCallback(
    (mode: "cards" | "list") => updateSettings({ modsViewMode: mode }),
    [updateSettings]
  )

  const filteredModules = useMemo(
    () =>
      filterModules(allModules, {
        searchTerm,
        moduleType,
        moduleFaculty,
        moduleLevel,
        currentOnly: currentOnly === "true"
      }),
    [
      allModules,
      searchTerm,
      moduleType,
      moduleFaculty,
      moduleLevel,
      currentOnly
    ]
  )

  const displayedModules = useMemo(
    () => filteredModules.slice(0, displayCount),
    [filteredModules, displayCount]
  )

  const groupedModules = useMemo(
    () =>
      modsGroupBy !== "none"
        ? groupModules(filteredModules, modsGroupBy)
        : null,
    [filteredModules, modsGroupBy]
  )

  const hasMore = displayCount < filteredModules.length
  const moduleCountLabel = `${filteredModules.length} module${
    filteredModules.length !== 1 ? "s" : ""
  }`

  useEffect(() => {
    setDisplayCount(PAGE_SIZE)
    setExpandedGroups(new Set())
  }, [
    searchTerm,
    moduleType,
    moduleFaculty,
    moduleLevel,
    currentOnly,
    modsGroupBy
  ])

  useEffect(() => {
    if (!loaderRef.current) return
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        setDisplayCount((c) => c + PAGE_SIZE)
      }
    })
    observer.observe(loaderRef.current)
    return () => observer.disconnect()
  }, [hasMore])

  const renderModules = (modules: AllModule[], footer?: React.ReactNode) =>
    modsViewMode === "cards" ? (
      footer ? (
        <div className="overflow-hidden rounded-lg border-2">
          <div className="grid grid-cols-1 gap-4 p-3 md:grid-cols-3">
            {modules.map((m, i) => (
              <ModuleCardDetail
                key={i}
                code={m.code}
                moduleData={m}
                searchTerm={searchTerm}
              />
            ))}
          </div>
          <div className="border-t">{footer}</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {modules.map((m, i) => (
            <ModuleCardDetail
              key={i}
              code={m.code}
              moduleData={m}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      )
    ) : (
      <div className="overflow-hidden rounded-lg border-2">
        {modules.map((m, i) => (
          <div key={i} className="border-b last:border-b-0">
            <ModuleListRow
              code={m.code}
              moduleData={m}
              searchTerm={searchTerm}
            />
          </div>
        ))}
        {footer && <div className="border-t">{footer}</div>}
      </div>
    )

  return (
    <div className="relative space-y-3">
      <Header
        title="NTU Modules"
        subtitle={`AY${year}/${nextYear} Semester ${semester}`}
      />

      <div className="flex w-full flex-col gap-2">
        <div className="flex gap-2">
          <ModsSearchInput paramsValue={searchTerm} />
          <Button
            variant="outline"
            size="sm"
            className="h-9 shrink-0 gap-1.5"
            onClick={() => setFiltersOpen((o) => !o)}>
            <SlidersHorizontal className="size-3.5" />
            Filters
            {activeFilterCount > 0 && (
              <span className="bg-primary text-primary-foreground flex size-4 items-center justify-center rounded-full text-[10px] font-medium">
                {activeFilterCount}
              </span>
            )}
            <ChevronDown
              className={`size-3.5 transition-transform${filtersOpen ? "rotate-180" : ""}`}
            />
          </Button>
        </div>

        {filtersOpen && (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-4">
            <ModsModuleTypeSelect paramsValue={moduleType} />
            <ModsFacultySelect paramsValue={moduleFaculty} />
            <ModsLevelSelect searchTerm={searchTerm} paramValue={moduleLevel} />
            <ModsCurrentOnlyToggle paramsValue={currentOnly} />
          </div>
        )}
      </div>

      <ModsActiveFilters
        searchTerm={searchTerm}
        moduleType={moduleType}
        moduleLevel={moduleLevel}
        moduleFaculty={moduleFaculty}
        currentOnly={currentOnly}
      />

      <hr className="py-2" />

      {!isLoading && filteredModules.length === 0 && <ModsEmptyCard />}

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 pb-2 sm:flex sm:justify-between">
        <div className="min-w-0 sm:flex sm:items-center sm:gap-3">
          <ModsGroupBySelect />

          {!isLoading && filteredModules.length > 0 && (
            <p className="text-muted-foreground hidden text-sm sm:block">
              {moduleCountLabel}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            variant={modsViewMode === "cards" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("cards")}
            aria-label="Card view">
            <LayoutGrid className="size-4" />
          </Button>
          <Button
            variant={modsViewMode === "list" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            aria-label="List view">
            <List className="size-4" />
          </Button>
        </div>
        {!isLoading && filteredModules.length > 0 && (
          <p className="text-muted-foreground col-start-1 text-sm sm:hidden">
            {moduleCountLabel}
          </p>
        )}
      </div>

      <hr className="mt-4" />

      {(() => {
        if (isLoading) {
          return modsViewMode === "cards" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {Array.from({ length: LOADING_CARD_COUNT }).map((_, i) => (
                <ModuleCardDetailLoading key={i} />
              ))}
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border-2">
              {Array.from({ length: LOADING_LIST_COUNT }).map((_, i) => (
                <div
                  key={i}
                  className={i !== LOADING_LIST_COUNT - 1 ? "border-b" : ""}>
                  <ModuleListRowLoading />
                </div>
              ))}
            </div>
          )
        }

        if (groupedModules) {
          return (
            <div className="space-y-6">
              {groupedModules.map(({ key, label, modules }) => {
                const isExpanded = expandedGroups.has(key)
                const visible = isExpanded
                  ? modules
                  : modules.slice(0, GROUP_DEFAULT_VISIBLE)
                const hidden = modules.length - GROUP_DEFAULT_VISIBLE
                return (
                  <div key={key} className="space-y-3">
                    <h3 className="text-sm font-medium">
                      {label}{" "}
                      <span className="text-muted-foreground">
                        ({modules.length})
                      </span>
                    </h3>
                    {renderModules(
                      visible,
                      !isExpanded && hidden > 0 ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full rounded-none"
                          onClick={() =>
                            setExpandedGroups(
                              (prev) => new Set(Array.from(prev).concat(key))
                            )
                          }>
                          <ChevronDown className="mr-1 size-4" />
                          See {hidden} more
                        </Button>
                      ) : undefined
                    )}
                  </div>
                )
              })}
            </div>
          )
        }

        return renderModules(displayedModules)
      })()}

      {!isLoading && hasMore && modsGroupBy === "none" && (
        <div ref={loaderRef} className="h-4" />
      )}

      {!isLoading && (
        <p className="text-muted-foreground hover:text-primary-alt text-center text-sm transition-colors">
          <Link
            href="https://wis.ntu.edu.sg/webexe/owa/aus_subj_cont.main"
            target="_blank">
            Updated as at AY{year}/{nextYear}
          </Link>
        </p>
      )}
    </div>
  )
}

export default ModsPage
