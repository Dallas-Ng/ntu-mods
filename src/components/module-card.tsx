import Link from "next/link"

import { MODULE_CATEGORY } from "@/lib/constants"
import { getModuleCategories } from "@/lib/get-module-category"
import { getModuleFaculty } from "@/lib/get-module-faculty"
import { getModuleUrl, getModuleVersionUrl } from "@/lib/module-url"
import { cn } from "@/lib/utils"
import type { ApiModule } from "@/lib/server/get-module-metadata"

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

interface ModuleCardDetailProps {
  code: string
  moduleData: ApiModule
}

export const ModuleCardDetail = ({ code, moduleData }: ModuleCardDetailProps) => {
  const isCurrentSemester = moduleData.isCurrentSemester !== false
  const href =
    isCurrentSemester || !moduleData.latestYear || !moduleData.latestSemester
      ? getModuleUrl(code)
      : getModuleVersionUrl(code, moduleData.latestYear, moduleData.latestSemester)

  return (
    <Link key={code} href={href}>
      <div
        className={cn(
          "rounded-lg border-2 p-3 transition-colors hover:bg-accent",
          !isCurrentSemester && "opacity-75"
        )}>
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm text-muted-foreground">{moduleData.code}</p>
          {!isCurrentSemester && (
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              Not offered this sem
            </span>
          )}
        </div>

        <p className="truncate">{moduleData.title}</p>

        <div className="mt-4 flex items-center justify-between text-xs">
          <div className="flex gap-1 text-muted-foreground">
            {getModuleCategories(moduleData.searchKeys).map((category, i) => (
              <div key={i} className="rounded-full border px-2 py-0">
                <span key={i}>{MODULE_CATEGORY[category]}</span>
              </div>
            ))}
          </div>

          <div className="text-sm text-muted-foreground">
            {getModuleFaculty(code, moduleData.searchKeys)}
          </div>
        </div>
      </div>
    </Link>
  )
}

export const ModuleCardDetailLoading = () => (
  <div className="h-[108px] cursor-pointer rounded-lg border-2 p-3 transition-colors hover:bg-accent">
    <Skeleton className="h-[20px] w-[70px]" />

    <Skeleton className="mt-[4px] h-[20px]" />

    <div className="mt-4 flex justify-between">
      <Skeleton className="h-[18px] w-[41px] rounded-full" />

      <Skeleton className="h-[20px] w-[28px]" />
    </div>
  </div>
)

export default ModuleCard
