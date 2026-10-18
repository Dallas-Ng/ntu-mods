import type { AllModule } from "@/types/mods"
import { MODULE_CATEGORY } from "@/lib/constants"
import { getModuleUrl, getModuleVersionUrl } from "@/lib/module-url"
import { cn } from "@/lib/utils"

import { Skeleton } from "./ui/skeleton"

interface ModuleCardProps {
  module: { code: string; title: string }
  cardClassName?: string
}

export const ModuleCard = ({ module, cardClassName }: ModuleCardProps) => (
  <a key={module.code} href={`/mods/${module.code}`}>
    <div
      className={cn(
        "hover:bg-accent text-muted-foreground rounded-2xl border p-4 text-sm transition-colors",
        cardClassName
      )}>
      <p className="font-mono text-xs">{module.code}</p>

      <p className="text-foreground mt-1 truncate font-medium">
        {module.title}
      </p>
    </div>
  </a>
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

// AllModule, not DbModule: these render from the modules.json list payload,
// which now carries only the fields the list view actually reads.
interface ModuleCardDetailProps {
  code: string
  moduleData: AllModule
  searchTerm?: string
  timetableButton?: React.ReactNode
  favouriteButton?: React.ReactNode
}

function getHref(moduleData: AllModule, code: string) {
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

const lastOffered = (m: AllModule) =>
  m.latestYear
    ? `Last offered AY${m.latestYear.slice(2)}/${String(parseInt(m.latestYear) + 1).slice(2)}`
    : "Not offered"

export const ModuleCardDetail = ({
  code,
  moduleData,
  searchTerm = "",
  timetableButton,
  favouriteButton
}: ModuleCardDetailProps) => {
  const isCurrentSemester = moduleData.isCurrentSemester !== false
  const categories = moduleData.categories ?? []
  const faculty = moduleData.faculty ?? ""

  return (
    <div
      className={cn(
        "hover:bg-accent group relative flex h-32 flex-col rounded-2xl border p-4 transition-colors",
        isCurrentSemester ? "bg-muted border-transparent" : "border-border"
      )}>
      <a
        href={getHref(moduleData, code)}
        className="flex min-w-0 flex-1 flex-col pr-20 after:absolute after:inset-0 after:rounded-2xl">
        <div className="text-muted-foreground flex items-center gap-1.5 text-xs whitespace-nowrap">
          <span className="font-mono">{highlightText(code, searchTerm)}</span>
          {moduleData.au && <span>· {moduleData.au} AU</span>}
          {faculty && <span>· {faculty}</span>}
        </div>
        <p className="mt-1 line-clamp-2 text-base leading-snug font-semibold tracking-tight">
          {highlightText(moduleData.title, searchTerm)}
        </p>
        <div className="mt-auto flex gap-1 overflow-hidden text-xs">
          {!isCurrentSemester && (
            <span className="text-foreground shrink-0 rounded-full border px-2 py-0.5">
              {lastOffered(moduleData)}
            </span>
          )}
          {categories.map((category, i) => (
            <span
              key={i}
              className={cn(
                "text-muted-foreground shrink-0 truncate rounded-full px-2 py-0.5",
                isCurrentSemester ? "bg-background" : "bg-muted"
              )}>
              {MODULE_CATEGORY[category]}
            </span>
          ))}
        </div>
      </a>

      {/* Quiet icon actions above the full-card link; labelled via title/aria */}
      <div className="absolute top-3 right-3 z-10 flex gap-1.5">
        {timetableButton}
        {favouriteButton}
      </div>
    </div>
  )
}

export const ModuleCardDetailLoading = () => (
  <div className="bg-muted flex h-32 flex-col rounded-2xl p-4">
    <Skeleton className="bg-background mb-2 h-4 w-16" />
    <Skeleton className="bg-background mb-1 h-5 w-full" />
    <Skeleton className="bg-background h-5 w-3/4" />
    <Skeleton className="bg-background mt-auto h-5 w-24" />
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
  const categories = moduleData.categories ?? []
  const faculty = moduleData.faculty ?? ""

  return (
    <div className={cn("flex overflow-hidden transition-colors")}>
      {/* Left: navigable link area */}
      <a
        href={getHref(moduleData, code)}
        className="hover:bg-accent flex min-w-0 flex-1 flex-col gap-0.5 px-4 py-3 transition-colors sm:flex-row sm:items-center sm:gap-3">
        <span className="text-muted-foreground shrink-0 font-mono text-xs sm:w-20 sm:text-sm">
          {highlightText(code, searchTerm)}
        </span>

        <span className="w-full min-w-0 flex-1 truncate text-sm">
          {highlightText(moduleData.title, searchTerm)}
        </span>

        <div className="text-muted-foreground hidden shrink-0 items-center gap-1 text-xs sm:flex">
          {!isCurrentSemester && (
            <span className="text-foreground rounded-full border px-2 py-0.5">
              {lastOffered(moduleData)}
            </span>
          )}
          {categories.map((category, i) => (
            <span key={i} className="bg-background rounded-full px-2 py-0.5">
              {MODULE_CATEGORY[category]}
            </span>
          ))}
        </div>

        <span className="text-muted-foreground hidden shrink-0 text-xs sm:block">
          {moduleData.au && `${moduleData.au} AU`}
        </span>

        <span className="text-muted-foreground hidden w-10 shrink-0 text-right text-xs sm:block">
          {faculty}
        </span>
      </a>

      {/* Right: separate icon buttons */}
      {(timetableButton || favouriteButton) && (
        <div className="flex shrink-0 items-center gap-1.5 pr-3">
          {timetableButton}
          {favouriteButton}
        </div>
      )}
    </div>
  )
}

export const ModuleListRowLoading = () => (
  <div className="flex h-11 items-center gap-3 px-4">
    <Skeleton className="bg-background h-4 w-20 shrink-0" />
    <Skeleton className="bg-background h-4 flex-1" />
    <Skeleton className="bg-background hidden h-4 w-16 sm:block" />
    <Skeleton className="bg-background h-4 w-10 shrink-0" />
  </div>
)

export default ModuleCard
