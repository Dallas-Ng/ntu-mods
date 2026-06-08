"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { LayoutGrid, List } from "lucide-react"

import type { AllModule } from "@/types/mods"
import type { ApiModule } from "@/lib/server/get-module-metadata"
import { MODULE_FACULTY } from "@/lib/constants"
import { filterModules } from "@/lib/filter-modules"
import { getModuleFaculty } from "@/lib/get-module-faculty"
import { useDebounce } from "@/hooks/use-debounce"
import { useSettings } from "@/hooks/use-settings"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { ModuleCardDetail, ModuleListRow } from "@/components/module-card"

const PAGE_SIZE = 100

interface Props {
  initialModules: AllModule[]
}

export function BdeModuleList({ initialModules }: Props) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { modsViewMode, updateSettings } = useSettings()

  const faculty = searchParams.get("faculty") ?? "all"
  const level = searchParams.get("level") ?? "all"

  const [searchInput, setSearchInput] = useState("")
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE)
  const debouncedSearch = useDebounce(searchInput, 300)

  const availableFaculties = useMemo(() => {
    const seen = new Set<string>()
    for (const m of initialModules) {
      const f = getModuleFaculty(m.code, m.searchKeys ?? [])
      if (f) seen.add(f)
    }
    return Array.from(seen).sort()
  }, [initialModules])

  const availableLevels = useMemo(() => {
    const seen = new Set<string>()
    for (const m of initialModules) {
      const l = m.code.slice(2, 3)
      if (l) seen.add(l)
    }
    return Array.from(seen).sort()
  }, [initialModules])

  const filtered = useMemo(
    () =>
      filterModules(initialModules, {
        searchTerm: debouncedSearch,
        moduleType: "all",
        moduleFaculty: faculty,
        moduleLevel: level,
        currentOnly: false
      }),
    [initialModules, debouncedSearch, faculty, level]
  )

  useEffect(() => {
    setDisplayCount(PAGE_SIZE)
  }, [debouncedSearch, faculty, level])

  const displayed = filtered.slice(0, displayCount)
  const hasMore = displayCount < filtered.length

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value === "all") {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    const query = params.toString()
    router.push(`/bde${query ? `?${query}` : ""}`, { scroll: false })
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2">
        <Input
          placeholder="Search by module code or title"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />

        <div className="flex gap-2">
          <Select value={faculty} onValueChange={(v) => updateParam("faculty", v)}>
            <SelectTrigger className="h-9 flex-1">
              <SelectValue placeholder="All schools" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All schools</SelectItem>
              {availableFaculties.map((f) => (
                <SelectItem key={f} value={f}>
                  {MODULE_FACULTY[f as keyof typeof MODULE_FACULTY] ?? f} ({f})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={level} onValueChange={(v) => updateParam("level", v)}>
            <SelectTrigger className="h-9 w-[140px] shrink-0">
              <SelectValue placeholder="All levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All levels</SelectItem>
              {availableLevels.map((l) => (
                <SelectItem key={l} value={l}>
                  Level {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

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
      </div>

      <p className="text-muted-foreground text-sm">
        {filtered.length} of {initialModules.length} BDE modules
      </p>

      {filtered.length === 0 && (
        <p className="text-muted-foreground py-8 text-center text-sm">
          No modules match your filters.
        </p>
      )}

      {modsViewMode === "list" ? (
        <div className="divide-y rounded-lg border">
          {displayed.map((m) => (
            <ModuleListRow
              key={m.code}
              code={m.code}
              moduleData={m as unknown as ApiModule}
              searchTerm={debouncedSearch}
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
              searchTerm={debouncedSearch}
            />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="py-4 text-center">
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
