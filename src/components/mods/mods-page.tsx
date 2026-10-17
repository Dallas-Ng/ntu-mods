"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ChevronDown, Heart, LayoutGrid, List } from "lucide-react"
import posthog from "posthog-js"

import type { AllModule } from "@/types/mods"
import { filterModules, groupModules } from "@/lib/filter-modules"
import { latestSemester, latestYear } from "@/lib/semesters"
import { cn } from "@/lib/utils"
import { useAllModules } from "@/hooks/use-all-modules"
import { useFavourites } from "@/hooks/use-favourites"
import { useModsSearchParams } from "@/hooks/use-mods-search-params"
import { usePathname } from "@/hooks/use-pathname"
import { pushSearchParams, useSearchParams } from "@/hooks/use-search-params"
import { useSeasonIndexes } from "@/hooks/use-season-indexes"
import { useSettings } from "@/hooks/use-settings"
import { Button } from "@/components/ui/button"
import Header from "@/components/header"
import ModsAddToTimetableButton from "@/components/mods/mods-add-to-timetable-button"
import ModsEmptyCard from "@/components/mods/mods-empty-card"
import ModsFavouriteButton from "@/components/mods/mods-favourite-button"
import {
  FILTER_KEYS,
  ModsFilterChips,
  ModsFilterDrawer,
  type FacetKey
} from "@/components/mods/mods-filter-chips"
import { ModsGroupBySelect } from "@/components/mods/mods-group-by-select"
import ModsSearchInput from "@/components/mods/mods-search-input"
import {
  ModuleCardDetail,
  ModuleCardDetailLoading,
  ModuleListRow,
  ModuleListRowLoading
} from "@/components/module-card"

const PAGE_SIZE = 100
const GROUP_DEFAULT_VISIBLE = 10
const LOADING_CARD_COUNT = 9
const LOADING_LIST_COUNT = 12

const ModsPage = () => {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const searchTerm = searchParams.get("searchTerm") ?? ""
  const moduleType = searchParams.get("moduleType") ?? "all"
  const moduleFaculty = searchParams.get("moduleFaculty") ?? "all"
  const moduleLevel = searchParams.get("moduleLevel") ?? "all"
  const currentOnly = searchParams.get("currentOnly") ?? "true"
  const favouritesOnly = searchParams.get("favouritesOnly") ?? "false"
  const moduleDay = searchParams.get("moduleDay") ?? "all"
  const moduleTimeStart = searchParams.get("moduleTimeStart") ?? "all"
  const moduleTimeEnd = searchParams.get("moduleTimeEnd") ?? "all"

  const year = latestYear
  const semester = latestSemester
  const nextYear = parseInt(year) + 1
  const { modules: allModules, isLoading } = useAllModules()
  const { indexes } = useSeasonIndexes(year, semester)
  const { modsViewMode, modsGroupBy, updateSettings } = useSettings()
  const { favouriteModules } = useFavourites()
  const { setValue: setFavouritesOnly } = useModsSearchParams(
    favouritesOnly,
    "favouritesOnly"
  )
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const loaderRef = useRef<HTMLDivElement>(null)

  const allowedDays =
    moduleDay !== "all"
      ? moduleDay
          .split(",")
          .map(Number)
          .filter((d) => d >= 1 && d <= 7)
      : undefined
  const timeStart =
    moduleTimeStart !== "all" ? parseInt(moduleTimeStart) : undefined
  const timeEnd = moduleTimeEnd !== "all" ? parseInt(moduleTimeEnd) : undefined

  const hasActiveFilters =
    searchTerm !== "" ||
    moduleType !== "all" ||
    moduleFaculty !== "all" ||
    moduleLevel !== "all" ||
    currentOnly === "false" ||
    moduleDay !== "all" ||
    moduleTimeStart !== "all" ||
    moduleTimeEnd !== "all"

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    FILTER_KEYS.forEach((k) => params.delete(k))
    pushSearchParams(pathname, params.toString())
    posthog.capture("mods_filter_cleared", { filter_type: "all" })
  }

  const setViewMode = useCallback(
    (mode: "cards" | "list") => {
      updateSettings({ modsViewMode: mode })
      posthog.capture("mods_view_changed", { view: mode })
    },
    [updateSettings]
  )

  const filterOpts = useMemo(
    () => ({
      searchTerm,
      moduleType,
      moduleFaculty,
      moduleLevel,
      currentOnly: currentOnly === "true",
      favouritesOnly: favouritesOnly === "true",
      favouriteModules,
      allowedDays,
      timeStart,
      timeEnd,
      indexes
    }),
    [
      searchTerm,
      moduleType,
      moduleFaculty,
      moduleLevel,
      currentOnly,
      favouritesOnly,
      favouriteModules,
      allowedDays,
      timeStart,
      timeEnd,
      indexes
    ]
  )

  const filteredModules = useMemo(
    () => filterModules(allModules, filterOpts),
    [allModules, filterOpts]
  )

  const countOption = (key: FacetKey, value: string) =>
    filterModules(allModules, { ...filterOpts, [key]: value }).length

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
    modsGroupBy,
    moduleDay,
    moduleTimeStart,
    moduleTimeEnd
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
            className={cn(
              "h-9 w-9 shrink-0 gap-1.5 sm:w-auto",
              favouritesOnly === "true" && "bg-secondary"
            )}
            onClick={() =>
              setFavouritesOnly(favouritesOnly === "true" ? "false" : "true")
            }
            aria-label="Favourites only">
            <Heart
              className={`size-3.5 ${favouritesOnly === "true" ? "fill-rose-500 text-rose-500" : ""}`}
            />
            <span className="hidden sm:inline">Favourites</span>
          </Button>
          <div className="md:hidden">
            <ModsFilterDrawer
              resultCount={filteredModules.length}
              moduleType={moduleType}
              moduleFaculty={moduleFaculty}
              moduleLevel={moduleLevel}
              moduleDay={moduleDay}
              moduleTimeStart={moduleTimeStart}
              moduleTimeEnd={moduleTimeEnd}
              currentOnly={currentOnly}
              countOption={countOption}
              onClearAll={hasActiveFilters ? clearAllFilters : undefined}
            />
          </div>
        </div>

        <div className="hidden md:block">
          <ModsFilterChips
            moduleType={moduleType}
            moduleFaculty={moduleFaculty}
            moduleLevel={moduleLevel}
            moduleDay={moduleDay}
            moduleTimeStart={moduleTimeStart}
            moduleTimeEnd={moduleTimeEnd}
            currentOnly={currentOnly}
            countOption={countOption}
            onClearAll={hasActiveFilters ? clearAllFilters : undefined}
          />
        </div>
      </div>

      {!isLoading && filteredModules.length === 0 && <ModsEmptyCard />}

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 pt-1 pb-1 sm:flex sm:justify-between">
        <div className="min-w-0 sm:flex sm:items-center sm:gap-3">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm whitespace-nowrap">
              Group by
            </span>
            <ModsGroupBySelect />
          </div>

          {!isLoading && filteredModules.length > 0 && (
            <p className="text-muted-foreground hidden text-sm whitespace-nowrap sm:block">
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
          <p className="text-muted-foreground col-start-1 text-sm whitespace-nowrap sm:hidden">
            {moduleCountLabel}
          </p>
        )}
      </div>

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
        year={year}
        semester={semester}
      />

      {!isLoading && hasMore && modsGroupBy === "none" && (
        <div ref={loaderRef} className="h-4" />
      )}

      {!isLoading && (
        <p className="text-muted-foreground hover:text-primary-alt text-center text-sm transition-colors">
          <a
            href="https://wis.ntu.edu.sg/webexe/owa/aus_subj_cont.main"
            target="_blank"
            rel="noreferrer">
            Updated as at AY{year}/{nextYear}
          </a>
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
  year: string
  semester: string
}

function ModuleResults({
  isLoading,
  viewMode,
  groupedModules,
  displayedModules,
  expandedGroups,
  onExpandGroup,
  searchTerm,
  year,
  semester
}: ModuleResultsProps) {
  function timetableBtn(m: AllModule) {
    if (m.isCurrentSemester === false) return undefined
    return (
      <ModsAddToTimetableButton
        moduleKey={m.code}
        year={year}
        semester={semester}
        showText={false}
        triggerClassName="h-full w-full rounded-none"
        triggerVariant="ghost"
      />
    )
  }

  function favouriteBtn(m: AllModule) {
    return <ModsFavouriteButton moduleKey={m.code} />
  }

  function renderModules(modules: AllModule[], footer?: React.ReactNode) {
    return viewMode === "cards" ? (
      footer ? (
        <div className="overflow-hidden rounded-lg border-2">
          <div className="grid grid-cols-1 gap-4 p-3 md:grid-cols-2 lg:grid-cols-3">
            {modules.map((m, i) => (
              <ModuleCardDetail
                key={i}
                code={m.code}
                moduleData={m}
                searchTerm={searchTerm}
                timetableButton={timetableBtn(m)}
                favouriteButton={favouriteBtn(m)}
              />
            ))}
          </div>
          <div className="border-t">{footer}</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((m, i) => (
            <ModuleCardDetail
              key={i}
              code={m.code}
              moduleData={m}
              searchTerm={searchTerm}
              timetableButton={timetableBtn(m)}
              favouriteButton={favouriteBtn(m)}
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
              timetableButton={timetableBtn(m)}
              favouriteButton={favouriteBtn(m)}
            />
          </div>
        ))}
        {footer && <div className="border-t">{footer}</div>}
      </div>
    )
  }

  if (isLoading) {
    return viewMode === "cards" ? (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
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
