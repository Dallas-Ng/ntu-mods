import { M_INDEXES } from "@/data/2023/m-indexes"
import { TRUN_M_DATA } from "@/data/2023/trun-m-data"

export const getRandomModuleIndex = () => {
  const moduleKeys = Object.keys(TRUN_M_DATA)
  const randomModuleKey =
    moduleKeys[Math.floor(Math.random() * moduleKeys.length)]

  const indexes = M_INDEXES[randomModuleKey]

  const indexKeys = Object.keys(indexes)
  const randomIndex = indexKeys[Math.floor(Math.random() * indexKeys.length)]

  const index = indexes[randomIndex][0]

  return { randomModuleKey, randomIndex: index }
}
