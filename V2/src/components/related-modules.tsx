import { getRelatedModules } from "@/lib/get-related-modules"

import ModuleCard from "./module-card"

interface Props {
  moduleKey: string
  limit?: number
  emptyContent?: React.ReactNode
}

const RelatedModules = ({
  moduleKey,
  limit = 0,
  emptyContent = undefined
}: Props) => {
  const relatedModules = getRelatedModules(moduleKey, limit) // limit 12 only

  return relatedModules.length > 0 ? (
    <div className="grid grid-cols-1 gap-2 text-sm md:grid-cols-3">
      {relatedModules.map((module) => (
        <ModuleCard key={module.code} module={module} />
      ))}
    </div>
  ) : (
    <>{emptyContent}</>
  )
}

export default RelatedModules
