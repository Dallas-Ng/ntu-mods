"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

import type { DbModule } from "@/lib/server/db/types"

import { hasValue, renderModuleValue, ROW_CLASS } from "./mods-info-table"

const FIELDS: Array<{ key: keyof DbModule; label: string }> = [
  { key: "notAvailableToProgramme", label: "Not Available To Programme" },
  {
    key: "notAvailableToAllProgrammeWith",
    label: "Not Available To All Programme With"
  },
  {
    key: "notAvailableAsBdeueToProgramme",
    label: "Not Available As BDE/UE To Programme"
  },
  {
    key: "notAvailableAsCoreToProgramme",
    label: "Not Available As Core To Programme"
  },
  {
    key: "notAvailableAsPeToProgramme",
    label: "Not Available As PE To Programme"
  },
  { key: "mutuallyExclusiveWith", label: "Mutually Exclusive With" },
  { key: "notOfferedAsBde", label: "Not Offered As BDE" },
  { key: "notOfferedAsUe", label: "Not Offered As Unrestricted Elective" }
]

interface Props {
  module: DbModule
}

const ModsExpandableFields = ({ module }: Props) => {
  const [expanded, setExpanded] = useState(false)

  const extrasRows = module.extras ? Object.entries(module.extras) : []
  const count =
    FIELDS.filter(({ key }) => hasValue(module[key])).length + extrasRows.length
  const hasContent = count > 0

  if (!hasContent) return null

  return (
    <div className="bg-muted overflow-hidden rounded-2xl">
      <button
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="hover:bg-accent flex w-full items-center justify-between px-5 py-3.5 transition-colors">
        <span className="flex items-center gap-2 text-sm font-semibold">
          Additional information
          <span className="bg-muted text-muted-foreground flex size-5 items-center justify-center rounded-full text-xs font-medium">
            {count}
          </span>
        </span>
        {expanded ? (
          <ChevronUp className="text-muted-foreground size-4" />
        ) : (
          <ChevronDown className="text-muted-foreground size-4" />
        )}
      </button>

      {expanded && (
        <dl className="space-y-3 border-t p-5 text-sm">
          {FIELDS.map(({ key, label }) => {
            const value = module[key]
            const has = hasValue(value)
            return (
              <div key={key} className={ROW_CLASS}>
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="min-w-0 break-words">
                  {has ? renderModuleValue(key, value) : "None"}
                </dd>
              </div>
            )
          })}
          {extrasRows.map(([label, value]) => (
            <div key={label} className={ROW_CLASS}>
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="min-w-0 break-words">{value}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  )
}

export default ModsExpandableFields
