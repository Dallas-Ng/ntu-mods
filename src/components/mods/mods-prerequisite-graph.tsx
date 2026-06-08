import Link from "next/link"

import { getModuleUrl } from "@/lib/module-url"
import type { PrerequisiteNode } from "@/lib/server/get-prerequisite-graph"

interface Props {
  moduleCode: string
  node: PrerequisiteNode
  graph: Record<string, PrerequisiteNode>
}

interface ModuleCardProps {
  code: string
  title?: string
  variant: "requires" | "unlocks"
}

function ModuleCard({ code, title, variant }: ModuleCardProps) {
  return (
    <Link
      href={getModuleUrl(code)}
      className={
        "border-border bg-background hover:bg-muted flex flex-col gap-0.5 rounded-md border px-3 py-2 text-sm transition-colors " +
        (variant === "requires"
          ? "border-l-2 border-l-amber-400"
          : "border-r-2 border-r-green-500")
      }>
      <span className="font-medium">{code}</span>
      {title && (
        <span className="text-muted-foreground line-clamp-2 text-xs leading-snug">
          {title}
        </span>
      )}
    </Link>
  )
}

const ModsPrerequisiteGraph = ({ moduleCode, node, graph }: Props) => {
  const hasRequires = node.requires.length > 0
  const hasRequiredBy = node.requiredBy.length > 0

  if (!hasRequires && !hasRequiredBy) return null

  return (
    <div>
      <h2 className="mb-4 text-lg">Prerequisite Graph</h2>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
        {hasRequires && (
          <div className="flex-1">
            <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
              Required before this module
            </p>
            <div className="flex flex-col gap-2">
              {node.requires.map((code) => (
                <ModuleCard
                  key={code}
                  code={code}
                  title={graph[code]?.title}
                  variant="requires"
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex shrink-0 flex-row items-center gap-2 sm:flex-col sm:justify-center sm:py-4">
          {hasRequires && (
            <span className="text-muted-foreground text-sm sm:-rotate-90">
              →
            </span>
          )}
          <div className="border-primary bg-primary/5 rounded-lg border-2 px-4 py-2 text-center">
            <span className="text-sm font-semibold">{moduleCode}</span>
          </div>
          {hasRequiredBy && (
            <span className="text-muted-foreground text-sm sm:-rotate-90">
              →
            </span>
          )}
        </div>

        {hasRequiredBy && (
          <div className="flex-1">
            <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
              Modules this unlocks
            </p>
            <div className="flex flex-col gap-2">
              {node.requiredBy.slice(0, 20).map((code) => (
                <ModuleCard
                  key={code}
                  code={code}
                  title={graph[code]?.title}
                  variant="unlocks"
                />
              ))}
              {node.requiredBy.length > 20 && (
                <span className="text-muted-foreground px-1 text-xs">
                  +{node.requiredBy.length - 20} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ModsPrerequisiteGraph
