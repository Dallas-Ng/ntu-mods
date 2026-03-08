import { MODULE_MAP } from "@/data/api/module-map"
import { INDEX_MAP } from "@/data/api/index-map"

export const getRandomModuleIndex = () => {
  // Only consider modules that have at least one index key
  const modulesWithIndexes = Object.entries(MODULE_MAP).filter(
    ([, entry]) => entry.indexKeys.length > 0
  )

  let randomModuleKey: string
  let randomIndexKey: string
  let index: Index

  do {
    const [code, entry] =
      modulesWithIndexes[Math.floor(Math.random() * modulesWithIndexes.length)]
    randomModuleKey = code
    randomIndexKey =
      entry.indexKeys[Math.floor(Math.random() * entry.indexKeys.length)]
    index = INDEX_MAP[randomIndexKey]?.[0]
  } while (!index)

  return { randomModuleKey, randomIndex: index }
}
