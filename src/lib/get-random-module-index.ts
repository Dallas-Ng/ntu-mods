import { M_INDEXES } from "@/data/2024/m-indexes"
import { TRUN_M_DATA } from "@/data/2024/trun-m-data"

export const getRandomModuleIndex = () => {
  const moduleKeys = Object.keys(TRUN_M_DATA)
  let randomModuleKey
  let indexes

  // Continue to select a random module key until a valid one is found
  do {
    randomModuleKey = moduleKeys[Math.floor(Math.random() * moduleKeys.length)]
    indexes = M_INDEXES[randomModuleKey]
  } while (!indexes)

  const indexKeys = Object.keys(indexes)
  const randomIndex = indexKeys[Math.floor(Math.random() * indexKeys.length)]

  const index = indexes[randomIndex][0]

  return { randomModuleKey, randomIndex: index }
}
