"use client"

import { useState } from "react"
import Link from "next/link"
import { TRUN_COURSE_CONTENT } from "@/data/truncated-course-content"

import { formatTitle } from "@/lib/format"
import { useDebounce } from "@/hooks/use-debounce"
import { Input } from "@/components/ui/input"

export default function ModsPage() {
  const [search, setSearch] = useState("")

  const dbSearchTerm = useDebounce(search, 200) // arbitrary delay - anything lower makes it feel laggy

  const filteredModules = Object.entries(TRUN_COURSE_CONTENT).filter(
    ([moduleCode, title]) =>
      dbSearchTerm === "" ||
      moduleCode.toLowerCase().includes(dbSearchTerm.toLowerCase()) ||
      title.toLowerCase().includes(dbSearchTerm.toLowerCase())
  )

  return (
    <div className="space-y-3">
      <h1 className="text-3xl font-semibold capitalize">NTU Modules</h1>

      {filteredModules.length === Object.keys(TRUN_COURSE_CONTENT).length ? (
        <p className="text-secondary">
          View all {Object.keys(TRUN_COURSE_CONTENT).length} modules offered by
          NTU.
        </p>
      ) : (
        <p className="text-secondary">
          Filtered down to {filteredModules.length} modules.
        </p>
      )}

      <Input
        name="moduleCode"
        placeholder="Search for module name or code"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
        {filteredModules.map(([code, title]) => {
          return (
            <Link key={code} href={`/mods/${code}`}>
              <div className={"rounded-lg border p-2"}>
                <p className="text-sm text-secondary">{code}</p>
                <p className="capitalize">{formatTitle(title)}</p>
              </div>
            </Link>
          )
        })}
      </div>

      <p className="text-center text-sm text-secondary transition-colors hover:text-secondary-foreground">
        <Link
          href="https://wis.ntu.edu.sg/webexe/owa/aus_subj_cont.main"
          target="_blank">
          Updated as at AY2023/2024
        </Link>
      </p>
    </div>
  )
}
