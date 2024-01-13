"use client"

import { useState } from "react"
import Link from "next/link"
import { C_COURSE_DATA } from "@/data/consolidated-course-content-2023"

import { useDebounce } from "@/hooks/use-debounce"
import { Input } from "@/components/ui/input"
import ModuleCard from "@/components/module-card"

export default function ModsPage() {
  const [search, setSearch] = useState("")

  const dbSearchTerm = useDebounce(search, 200) // arbitrary delay - anything lower makes it feel laggy

  const filteredModules = Object.values(C_COURSE_DATA).filter((module) => {
    if (dbSearchTerm === "") return true

    return (
      module.code.toLowerCase().includes(dbSearchTerm.toLowerCase()) ||
      module.title.toLowerCase().includes(dbSearchTerm.toLowerCase())
    )
  })

  return (
    <div className="space-y-3">
      <h1 className="text-3xl font-semibold capitalize">NTU Modules</h1>

      {filteredModules.length === Object.keys(C_COURSE_DATA).length ? (
        <p className="text-secondary">
          View all {Object.keys(C_COURSE_DATA).length} modules offered by NTU.
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
        {filteredModules.map((module) => (
          <ModuleCard key={module.code} module={module} />
        ))}
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
