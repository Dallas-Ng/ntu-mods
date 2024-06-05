import { M_DATA } from "@/data/2024/m-data"

import { getModule } from "./get-module"

/**
 * Retrieves an array of related modules based on the given module key.
 * A related module is defined as a module with the same course prefix and a course number difference of 999 or less.
 */
export const getRelatedModules = (moduleKey: string, limit = 0): Module[] => {
  let relatedModules: Module[] = []
  const keyPrefix = moduleKey.slice(0, 2)

  const moduleKeys = Object.entries(M_DATA).filter(([relatedModuleKey]) => {
    const coursePrefix = relatedModuleKey.slice(0, 2)

    return coursePrefix === keyPrefix && relatedModuleKey !== moduleKey
  })

  // Limit the number of related modules
  if (limit > 0) moduleKeys.splice(limit)

  if (moduleKeys.length > 0) {
    relatedModules = (
      moduleKeys
        .map(([moduleKey]) => getModule(moduleKey))
        .filter((x) => x) as Module[]
    )
      // Sort by ascending course number
      .sort((a, b) => parseInt(a.code.slice(2)) - parseInt(b.code.slice(2)))
  }

  return relatedModules
}
