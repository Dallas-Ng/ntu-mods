"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

import type { ApiModule } from "@/lib/server/db/types"
import { cn } from "@/lib/utils"

import { hasValue, renderModuleValue } from "./mods-info-table"

const FIELDS: Array<{ key: keyof ApiModule; label: string }> = [
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
  module: ApiModule
}

const ModsExpandableFields = ({ module }: Props) => {
  const [expanded, setExpanded] = useState(false)

  const extrasRows = module.extras ? Object.entries(module.extras) : []
  const hasContent =
    FIELDS.some(({ key }) => hasValue(module[key])) || extrasRows.length > 0

  if (!hasContent) return null

  return (
    <div>
      <button
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          "hover:bg-muted/50 flex w-full cursor-pointer items-center justify-between rounded-t-md border-2 border-b-0 border-slate-200 px-4 py-3 dark:border-slate-900",
          !expanded && "rounded-b-md border-b-2"
        )}>
        <span className="text-sm font-medium">Additional Information</span>
        {expanded ? (
          <ChevronUp className="text-muted-foreground size-4" />
        ) : (
          <ChevronDown className="text-muted-foreground size-4" />
        )}
      </button>

      <table
        className={cn("bg-background w-full text-sm", !expanded && "hidden")}>
        <tbody>
          {FIELDS.map(({ key, label }) => {
            const value = module[key]
            const has = hasValue(value)
            return (
              <tr key={key} className="border-t">
                <td
                  className={cn(
                    "w-[200px] px-4 py-2 font-medium",
                    !has && "text-muted-foreground"
                  )}>
                  {label}
                </td>
                <td className="px-4 py-2">
                  {has && renderModuleValue(key, value)}
                </td>
              </tr>
            )
          })}
          {extrasRows.map(([label, value]) => (
            <tr key={label} className="border-t">
              <td className="w-[200px] px-4 py-2">{label}</td>
              <td className="px-4 py-2">{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default ModsExpandableFields
