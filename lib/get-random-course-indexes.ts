import { C_DATA } from "@/data/consolidated-2023-2"

export function getRandomCourseIndex() {
  const courseKeys = Object.keys(C_DATA)
  const randomCourseKey =
    courseKeys[Math.floor(Math.random() * courseKeys.length)]

  const courseIndexes = C_DATA[randomCourseKey].indexes

  const indexKeys = Object.keys(courseIndexes)
  const randomIndex = indexKeys[Math.floor(Math.random() * indexKeys.length)]

  const index = courseIndexes[randomIndex][0]

  return { randomCourseKey, randomIndex: index }
}
