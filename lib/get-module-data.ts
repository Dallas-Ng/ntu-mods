import { C_COURSE_DATA_2023_1 } from "@/data/consolidated-course-content-2023-1"
import { C_COURSE_DATA_2023_2 } from "@/data/consolidated-course-content-2023-2"

export function getModuleData(moduleKey: string): CourseData | undefined {
  const data_2023_2 = C_COURSE_DATA_2023_2[moduleKey]
  if (data_2023_2) return data_2023_2

  const data_2023_1 = C_COURSE_DATA_2023_1[moduleKey]
  if (data_2023_1) return data_2023_1

  return undefined
}
