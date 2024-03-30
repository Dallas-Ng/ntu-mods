import { getModuleIndexes } from "./get-module-indexes"

/**
 *
 */
export const getModuleWorkload = (moduleKey: string) => {
  const moduleIndexes = getModuleIndexes(moduleKey)

  const indexKeys = Object.keys(moduleIndexes)
  const randomIndex = indexKeys[Math.floor(Math.random() * indexKeys.length)]

  const indexes = moduleIndexes[randomIndex] ?? []

  // Duration is in 30 minutes chunks, divide by 2 to get hours
  const moduleWorkload = {
    lec:
      indexes
        .filter((index) => index.type.includes("LEC"))
        .reduce((acc, index) => acc + index.duration, 0) / 2,
    des:
      indexes
        .filter((index) => index.type === "DES")
        .reduce((acc, index) => acc + index.duration, 0) / 2,
    lab:
      indexes
        .filter((index) => index.type === "LAB")
        .reduce((acc, index) => acc + index.duration, 0) / 2,
    prj:
      indexes
        .filter((index) => index.type === "PRJ")
        .reduce((acc, index) => acc + index.duration, 0) / 2,
    sem:
      indexes
        .filter((index) => index.type === "SEM")
        .reduce((acc, index) => acc + index.duration, 0) / 2,
    tut:
      indexes
        .filter((index) => index.type === "TUT")
        .reduce((acc, index) => acc + index.duration, 0) / 2
  }
  return {
    moduleWorkload,
    totalHours: indexes.reduce((acc, cur) => acc + cur.duration, 0) / 2
  }
}
