"use client"

import { useMemo } from "react"
import { usePathname } from "next/navigation"

import type { ApiModule } from "@/lib/server/get-module-metadata"
import { useAllModules } from "@/hooks/use-all-modules"

import ModuleCard from "../module-card"

const ModsNotFoundRelatedMods = () => {
  const pathname = usePathname()
  const moduleKey = pathname.split("/")[2]?.toUpperCase() ?? ""
  const { modules } = useAllModules()

  const related = useMemo(() => {
    if (!moduleKey) return []
    const prefix = moduleKey.slice(0, 2)
    return modules
      .filter((m) => m.code.startsWith(prefix) && m.code !== moduleKey)
      .slice(0, 9) as ApiModule[]
  }, [modules, moduleKey])

  if (related.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-muted-foreground text-sm">Related modules</p>
      <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
        {related.map((module) => (
          <ModuleCard key={module.code} module={module} />
        ))}
      </div>
    </div>
  )
}

export default ModsNotFoundRelatedMods
