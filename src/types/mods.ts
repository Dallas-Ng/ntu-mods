export type SearchModuleFaculty = ModuleFaculty | "all"

export type SearchModuleLevel = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "all"

export type SearchModuleType = ModuleType | "all"

export type ModsGroupBy = "none" | "level" | "au" | "faculty" | "type"

export type Semester = "s1" | "s2" | "all"

export interface AllModule {
  code: string
  title: string
  au: string
  /**
   * Precomputed at load from the offering's own programmes, replacing the raw
   * `searchKeys` array that used to ship to the browser and be re-parsed on
   * every card render and every filter pass.
   */
  faculty?: ModuleFaculty | ""
  categories?: ModuleType[]
  notAvailableToProgramme?: string
  isCurrentSemester?: boolean
  latestYear?: string
  latestSemester?: string
}
