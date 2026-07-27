import { getAllModuleMetadata } from "@/lib/server/get-module-metadata"

import ModuleCard from "./module-card"

interface Props {
  moduleKey: string
  currentYear: string
  currentSemester: string
  limit?: number
  emptyHref?: string
  emptyLabel?: string
}

const RelatedModules = async ({
  moduleKey,
  currentYear,
  currentSemester,
  limit = 0,
  emptyHref,
  emptyLabel
}: Props) => {
  const allMeta = await getAllModuleMetadata(currentYear, currentSemester)
  const prefix = moduleKey.slice(0, 2)

  let related = Object.values(allMeta)
    .filter((m) => m.code.slice(0, 2) === prefix && m.code !== moduleKey)
    .sort((a, b) => parseInt(a.code.slice(2)) - parseInt(b.code.slice(2)))

  if (limit > 0) related = related.slice(0, limit)

  return related.length > 0 ? (
    <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
      {related.map((module) => (
        <ModuleCard key={module.code} module={module} />
      ))}
    </div>
  ) : emptyHref && emptyLabel ? (
    <a
      href={emptyHref}
      className="text-muted-foreground hover:text-primary-alt text-sm transition-colors">
      {emptyLabel}
    </a>
  ) : null
}

export default RelatedModules
