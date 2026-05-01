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
        "rounded-lg border bg-card p-2 text-sm text-muted-foreground",
        cardClassName
      )}>
      <p>{module.code}</p>

      <p className="truncate text-foreground">{module.title}</p>
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
      <mark className="bg-transparent font-semibold text-foreground not-italic">
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
  searchTerm = ""
}: ModuleCardDetailProps) => {
  const isCurrentSemester = moduleData.isCurrentSemester !== false
  const categories = getModuleCategories(moduleData.searchKeys)
  const faculty = getModuleFaculty(code, moduleData.searchKeys)

  return (
    <Link key={code} href={getHref(moduleData, code)}>
      <div
        className={cn(
          "flex h-full flex-col rounded-lg border-2 p-3 transition-colors hover:bg-accent",
          !isCurrentSemester && "opacity-75"
        )}>
        {!isCurrentSemester && (
          <span className="mb-1.5 self-start rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            Not offered this sem
          </span>
        )}

        <p className="line-clamp-2 flex-1 leading-snug">
          {highlightText(moduleData.title, searchTerm)}
        </p>

        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <div className="flex min-w-0 items-center gap-2">
            <span className="shrink-0 font-mono">
              {highlightText(code, searchTerm)}
            </span>
            <div className="flex gap-1 overflow-hidden">
              {categories.map((category, i) => (
                <span key={i} className="shrink-0 truncate rounded-full border px-2 py-0">
                  {MODULE_CATEGORY[category]}
                </span>
              ))}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {moduleData.au && <span>{moduleData.au} AU</span>}
            <span>{faculty}</span>
          </div>
        </div>
      </div>
    </Link>
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
  searchTerm = ""
}: ModuleCardDetailProps) => {
  const isCurrentSemester = moduleData.isCurrentSemester !== false
  const categories = getModuleCategories(moduleData.searchKeys)
  const faculty = getModuleFaculty(code, moduleData.searchKeys)

  return (
    <Link key={code} href={getHref(moduleData, code)}>
      <div
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 transition-colors hover:bg-accent",
          !isCurrentSemester && "opacity-60"
        )}>
        <span className="w-[80px] shrink-0 font-mono text-sm text-muted-foreground">
          {highlightText(code, searchTerm)}
        </span>

        <span className="min-w-0 flex-1 truncate text-sm">
          {highlightText(moduleData.title, searchTerm)}
        </span>

        <div className="hidden shrink-0 items-center gap-1 text-xs text-muted-foreground sm:flex">
          {categories.map((category, i) => (
            <span key={i} className="rounded-full border px-2 py-0">
              {MODULE_CATEGORY[category]}
            </span>
          ))}
        </div>

        <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
          {moduleData.au && `${moduleData.au} AU`}
        </span>

        <span className="w-[40px] shrink-0 text-right text-xs text-muted-foreground">
          {faculty}
        </span>
      </div>
    </Link>
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
