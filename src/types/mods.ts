export type SearchModuleFaculty = ModuleFaculty | "all"

export type SearchModuleLevel = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "all"

export type SearchModuleType = ModuleType | "all"

export type ModsGroupBy = "none" | "level" | "au" | "faculty" | "type"

export type Semester = "s1" | "s2" | "all"

export interface AllModule {
  code: string
  title: string
  au: string
  searchKeys: string[]
  notAvailableToProgramme?: string
  isCurrentSemester?: boolean
  latestYear?: string
  latestSemester?: string
}
