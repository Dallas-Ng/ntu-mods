import { M_INDEXES } from "@/data/2024/m-indexes"

export const getModuleIndexes = (moduleKey: string) => {
  const moduleIndexes = M_INDEXES[moduleKey]

  const sanitisedModuleIndexes: { [indexKey: string]: Index[] } = {}

  // TODO. Fix day 0 problems for real
  /**
   * '23381'
   * '28380'
   * '36003'
   * '55128'
   * '63903'
   * '70903'
   * '05000'
   */
  if (!moduleIndexes) {
    return sanitisedModuleIndexes
  }

  Object.entries(moduleIndexes).forEach(([indexKey, index]) => {
    sanitisedModuleIndexes[indexKey] = index.filter((index) => index.day !== 0)
  })

  return sanitisedModuleIndexes
}
