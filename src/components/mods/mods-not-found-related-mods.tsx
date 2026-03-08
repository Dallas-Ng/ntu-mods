"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

import { useLatestSemester } from "@/hooks/use-latest-semester"
import ModuleCard from "../module-card"
import type { ApiModule } from "@/lib/server/get-module-metadata"

/**
 * Component that shows related modules on the not-found page.
 * Uses the API route so it works as a client component.
 */
const ModsNotFoundRelatedMods = () => {
  const pathname = usePathname()
  const moduleKey = pathname.split("/")[2]?.toUpperCase() ?? ""
  const { year, semester } = useLatestSemester()
  const [related, setRelated] = useState<ApiModule[]>([])

  useEffect(() => {
    if (!moduleKey) return
    const prefix = moduleKey.slice(0, 2)
    const params = new URLSearchParams({ year, semester, limit: "9" })
    fetch(`/api/data/modules?${params}`)
      .then((r) => r.json())
      .then((data) => {
        const filtered = (data.modules as ApiModule[])
          .filter((m) => m.code.startsWith(prefix) && m.code !== moduleKey)
          .slice(0, 9)
        setRelated(filtered)
      })
      .catch(() => {})
  }, [moduleKey, year, semester])

  if (related.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Related modules</p>
      <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
        {related.map((module) => (
          <ModuleCard key={module.code} module={module} />
        ))}
      </div>
    </div>
  )
}

export default ModsNotFoundRelatedMods
