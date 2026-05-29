"use client"

import { use, useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { ChevronDown, LayoutGrid, List, SlidersHorizontal } from "lucide-react"

import type {
  AllModule,
  SearchModuleFaculty,
  SearchModuleLevel,
  SearchModuleType,
  Semester
} from "@/types/mods"
import { filterModules, groupModules } from "@/lib/filter-modules"
import { latestSemester, latestYear } from "@/lib/semesters"
import { useAllModules } from "@/hooks/use-all-modules"
import { useSettings } from "@/hooks/use-settings"
import { Button } from "@/components/ui/button"
import Header from "@/components/header"
import { ModsActiveFilters } from "@/components/mods/mods-active-filters"
import { ModsCurrentOnlyToggle } from "@/components/mods/mods-current-only-toggle"
import ModsEmptyCard from "@/components/mods/mods-empty-card"
import { ModsFacultySelect } from "@/components/mods/mods-faculty-select"
import { ModsGroupBySelect } from "@/components/mods/mods-group-by-select"
import { ModsLevelSelect } from "@/components/mods/mods-module-level-select"
import { ModsModuleTypeSelect } from "@/components/mods/mods-module-type-select"
import ModsSearchInput from "@/components/mods/mods-search-input"
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

const ModsPage = (props: Props) => {
  const searchParams = use(props.searchParams)
  const {
    searchTerm = "",
    moduleType = "all",
    moduleFaculty = "all",
    moduleLevel = "all",
    currentOnly = "true"
  } = searchParams

  const year = latestYear
  const semester = latestSemester
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

      <ModuleResults
        isLoading={isLoading}
        viewMode={modsViewMode}
        groupedModules={groupedModules}
        displayedModules={displayedModules}
        expandedGroups={expandedGroups}
        onExpandGroup={(key) =>
          setExpandedGroups((prev) => new Set(Array.from(prev).concat(key)))
        }
        searchTerm={searchTerm}
      />

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

interface ModuleResultsProps {
  isLoading: boolean
  viewMode: "cards" | "list"
  groupedModules: ReturnType<typeof groupModules> | null
  displayedModules: AllModule[]
  expandedGroups: Set<string>
  onExpandGroup: (key: string) => void
  searchTerm: string
}

function ModuleResults({
  isLoading,
  viewMode,
  groupedModules,
  displayedModules,
  expandedGroups,
  onExpandGroup,
  searchTerm
}: ModuleResultsProps) {
  function renderModules(modules: AllModule[], footer?: React.ReactNode) {
    return viewMode === "cards" ? (
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
  }

  if (isLoading) {
    return viewMode === "cards" ? (
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
          const footer =
            !isExpanded && hidden > 0 ? (
              <Button
                variant="ghost"
                size="sm"
                className="w-full rounded-none"
                onClick={() => onExpandGroup(key)}>
                <ChevronDown className="mr-1 size-4" />
                See {hidden} more
              </Button>
            ) : undefined

          return (
            <div key={key} className="space-y-3">
              <h3 className="text-sm font-medium">
                {label}{" "}
                <span className="text-muted-foreground">
                  ({modules.length})
                </span>
              </h3>
              {renderModules(visible, footer)}
            </div>
          )
        })}
      </div>
    )
  }

  return renderModules(displayedModules)
}

export default ModsPage
