import Link from "next/link"

import { MODULE_CATEGORY } from "@/lib/constants"
import { getModuleCategories } from "@/lib/get-module-category"
import { getModuleFaculty } from "@/lib/get-module-faculty"
import { cn } from "@/lib/utils"

import { Skeleton } from "./ui/skeleton"

interface ModuleCardProps {
  module: Module
  variant?: "default" | "small"
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
  moduleData: Module
}

export const ModuleCardDetail = ({
  code,
  moduleData
}: ModuleCardDetailProps) => (
  <Link key={code} href={`/mods/${code}`}>
    <div className="rounded-lg border-2 p-3 transition-colors hover:bg-accent">
      <p className="text-sm text-muted-foreground">{moduleData.code}</p>

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
          {getModuleFaculty(moduleData.searchKeys)}
        </div>
      </div>
    </div>
  </Link>
)

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
