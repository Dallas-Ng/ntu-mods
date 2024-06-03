"use client"

import useSWR from "swr"

import { ApiModuleRelated } from "@/types/api.types"
import { get } from "@/lib/api"

import ModuleCard from "./module-card"

interface Props {
  moduleKey: string
  limit?: number
  emptyContent?: React.ReactNode
}

const RelatedModules = ({
  moduleKey,
  limit = 6,
  emptyContent = undefined
}: Props) => {
  const key = `/modules/${moduleKey}/related`
  const { data } = useSWR([key, limit], () =>
    get<ApiModuleRelated>(key, { limit })
  )

  const relatedModules = data?.related || []

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
