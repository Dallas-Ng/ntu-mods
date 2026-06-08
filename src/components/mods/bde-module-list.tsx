"use client"

import { useMemo, useRef, useState } from "react"
import { LayoutGrid, List } from "lucide-react"

import type { AllModule } from "@/types/mods"
import type { ApiModule } from "@/lib/server/get-module-metadata"
import { useSettings } from "@/hooks/use-settings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ModuleCardDetail,
  ModuleListRow
} from "@/components/module-card"

const PAGE_SIZE = 100

interface Props {
  initialModules: AllModule[]
}

export function BdeModuleList({ initialModules }: Props) {
  const [searchTerm, setSearchTerm] = useState("")
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE)
  const { modsViewMode, updateSettings } = useSettings()
  const loaderRef = useRef<HTMLDivElement>(null)

  const filtered = useMemo(() => {
    if (!searchTerm) return initialModules
    const q = searchTerm.toLowerCase()
    return initialModules.filter(
      (m) =>
        m.code.toLowerCase().includes(q) || m.title.toLowerCase().includes(q)
    )
  }, [initialModules, searchTerm])

  const displayed = filtered.slice(0, displayCount)
  const hasMore = displayCount < filtered.length

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          className="flex-1"
          placeholder="Search by module code or title"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value)
            setDisplayCount(PAGE_SIZE)
          }}
        />
        <Button
          variant={modsViewMode === "cards" ? "default" : "outline"}
          size="sm"
          className="h-9 shrink-0"
          onClick={() => updateSettings({ modsViewMode: "cards" })}>
          <LayoutGrid className="size-4" />
        </Button>
        <Button
          variant={modsViewMode === "list" ? "default" : "outline"}
          size="sm"
          className="h-9 shrink-0"
          onClick={() => updateSettings({ modsViewMode: "list" })}>
          <List className="size-4" />
        </Button>
      </div>

      <p className="text-muted-foreground text-sm">
        {filtered.length} module{filtered.length !== 1 ? "s" : ""}
      </p>

      {modsViewMode === "list" ? (
        <div className="rounded-lg border divide-y">
          {displayed.map((m) => (
            <ModuleListRow
              key={m.code}
              code={m.code}
              moduleData={m as unknown as ApiModule}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {displayed.map((m) => (
            <ModuleCardDetail
              key={m.code}
              code={m.code}
              moduleData={m as unknown as ApiModule}
              searchTerm={searchTerm}
            />
          ))}
        </div>
      )}

      {hasMore && (
        <div ref={loaderRef} className="py-4 text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setDisplayCount((c) => c + PAGE_SIZE)}>
            Load more
          </Button>
        </div>
      )}
    </div>
  )
}
