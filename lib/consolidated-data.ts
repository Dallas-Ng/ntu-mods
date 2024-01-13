import { C_DATA } from "@/data/consolidated-2023-2"

export function getCourse(courseKey: string): Course {
  return C_DATA[courseKey] as Course
}

export function getCourseIndexes(courseKey: string): Record<string, Index[]> {
  return C_DATA[courseKey].indexes
}
