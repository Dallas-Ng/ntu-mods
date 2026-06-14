import Link from "next/link"

import { MODULE_CATEGORY } from "@/lib/constants"
import { getModuleCategories } from "@/lib/get-module-category"
import { getModuleFaculty } from "@/lib/get-module-faculty"
import { getModuleUrl, getModuleVersionUrl } from "@/lib/module-url"
import type { ApiModule } from "@/lib/server/get-module-metadata"
import { cn } from "@/lib/utils"

import { Skeleton } from "./ui/skeleton"

interface ModuleCardProps {
  module: ApiModule
  cardClassName?: string
}

export const ModuleCard = ({ module, cardClassName }: ModuleCardProps) => (
  <Link key={module.code} href={`/mods/${module.code}`}>
    <div
      className={cn(
        "bg-card text-muted-foreground rounded-lg border p-2 text-sm",
        cardClassName
      )}>
      <p>{module.code}</p>

      <p className="text-foreground truncate">{module.title}</p>
    </div>
  </Link>
)

function highlightText(text: string, query: string) {
  if (!query) return <>{text}</>
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <>{text}</>
  return (
    <>
      {text.slice(0, idx)}
      <mark className="text-foreground bg-transparent font-semibold not-italic">
        {text.slice(idx, idx + query.length)}
      </mark>
      {text.slice(idx + query.length)}
    </>
  )
}

interface ModuleCardDetailProps {
  code: string
  moduleData: ApiModule
  searchTerm?: string
  timetableButton?: React.ReactNode
  favouriteButton?: React.ReactNode
}

function getHref(moduleData: ApiModule, code: string) {
  const isCurrentSemester = moduleData.isCurrentSemester !== false
  return isCurrentSemester ||
    !moduleData.latestYear ||
    !moduleData.latestSemester
    ? getModuleUrl(code)
    : getModuleVersionUrl(
        code,
        moduleData.latestYear,
        moduleData.latestSemester
      )
}

export const ModuleCardDetail = ({
  code,
  moduleData,
  searchTerm = "",
  timetableButton,
  favouriteButton
}: ModuleCardDetailProps) => {
  const isCurrentSemester = moduleData.isCurrentSemester !== false
  const categories = getModuleCategories(moduleData.searchKeys)
  const faculty = getModuleFaculty(code, moduleData.searchKeys)
  const hasActions = timetableButton || favouriteButton

  return (
    <div
      className={cn(
        "flex h-full overflow-hidden rounded-lg border-2",
        !isCurrentSemester && "opacity-75"
      )}>
      {/* Left: navigable link area with its own hover */}
      <Link
        href={getHref(moduleData, code)}
        className="hover:bg-accent flex min-w-0 flex-1 flex-col p-3 transition-colors"
        aria-label={`${code} ${moduleData.title}`}>
        <p className="line-clamp-1 flex-1 text-sm leading-tight">
          {highlightText(moduleData.title, searchTerm)}
        </p>

        <div className="text-muted-foreground mt-3 flex items-center gap-2 text-xs">
          <span className="shrink-0 font-mono">
            {highlightText(code, searchTerm)}
          </span>
          <div className="flex min-w-0 flex-1 gap-1 overflow-hidden">
            {categories.map((category, i) => (
              <span
                key={i}
                className="shrink-0 truncate rounded-full border px-2 py-0">
                {MODULE_CATEGORY[category]}
              </span>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {moduleData.au && <span>{moduleData.au} AU</span>}
            <span>{faculty}</span>
          </div>
        </div>
      </Link>

      {/* Right action column — two stacked buttons, no navigation */}
      {hasActions && (
        <div className="border-border/60 flex w-9 shrink-0 flex-col divide-y border-l">
          {timetableButton && (
            <div className="flex flex-1">{timetableButton}</div>
          )}
          {favouriteButton && (
            <div className="flex flex-1">{favouriteButton}</div>
          )}
        </div>
      )}
    </div>
  )
}

export const ModuleCardDetailLoading = () => (
  <div className="flex h-[108px] flex-col rounded-lg border-2 p-3">
    <Skeleton className="mb-1 h-[20px] w-full" />
    <Skeleton className="h-[20px] w-3/4" />
    <div className="mt-auto flex justify-between">
      <Skeleton className="h-[16px] w-[60px]" />
      <Skeleton className="h-[16px] w-[40px]" />
    </div>
  </div>
)

export const ModuleListRow = ({
  code,
  moduleData,
  searchTerm = "",
  timetableButton,
  favouriteButton
}: ModuleCardDetailProps) => {
  const isCurrentSemester = moduleData.isCurrentSemester !== false
  const categories = getModuleCategories(moduleData.searchKeys)
  const faculty = getModuleFaculty(code, moduleData.searchKeys)

  return (
    <div className={cn("flex overflow-hidden transition-colors", !isCurrentSemester && "opacity-60")}>
      {/* Left: navigable link area */}
      <Link
        href={getHref(moduleData, code)}
        className="hover:bg-accent flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 transition-colors"
        aria-label={`${code} ${moduleData.title}`}>
        <span className="text-muted-foreground w-[80px] shrink-0 font-mono text-sm">
          {highlightText(code, searchTerm)}
        </span>

        <span className="min-w-0 flex-1 truncate text-sm">
          {highlightText(moduleData.title, searchTerm)}
        </span>

        <div className="text-muted-foreground hidden shrink-0 items-center gap-1 text-xs sm:flex">
          {categories.map((category, i) => (
            <span key={i} className="rounded-full border px-2 py-0">
              {MODULE_CATEGORY[category]}
            </span>
          ))}
        </div>

        <span className="text-muted-foreground hidden shrink-0 text-xs sm:block">
          {moduleData.au && `${moduleData.au} AU`}
        </span>

        <span className="text-muted-foreground w-[40px] shrink-0 text-right text-xs">
          {faculty}
        </span>
      </Link>

      {/* Right: separate icon buttons */}
      {(timetableButton || favouriteButton) && (
        <div className="border-border/60 flex shrink-0 divide-x border-l">
          {timetableButton && <div className="flex w-9">{timetableButton}</div>}
          {favouriteButton && <div className="flex w-9">{favouriteButton}</div>}
        </div>
      )}
    </div>
  )
}

export const ModuleListRowLoading = () => (
  <div className="flex items-center gap-3 px-3 py-2.5">
    <Skeleton className="h-4 w-[80px] shrink-0" />
    <Skeleton className="h-4 flex-1" />
    <Skeleton className="hidden h-4 w-[60px] sm:block" />
    <Skeleton className="h-4 w-[40px] shrink-0" />
  </div>
)

export default ModuleCard
