/** Shared return types for db/repo.ts and edge/get-module-snapshot.ts. */

/**
 * Server-side module data. Structurally overlaps with the global Module type
 * but description is optional here (not all entries have it) and includes
 * additional server/API-only fields.
 */
export interface DbModule {
  code: string
  title: string
  au: string
  /**
   * Raw programme keys ("CSC;;1;F"). Server-side only — the client gets the
   * precomputed faculty/categories below instead, and never re-derives them.
   */
  searchKeys: string[]
  faculty?: ModuleFaculty | ""
  categories?: ModuleType[]
  prerequisite?: string[][]
  description?: string
  gradeType?: string
  mutuallyExclusiveWith?: string[]
  notAvailableToProgramme?: string
  notAvailableToAllProgrammeWith?: string
  notAvailableAsBdeueToProgramme?: string
  notAvailableAsCoreToProgramme?: string
  notAvailableAsPeToProgramme?: string
  notOfferedAsBde?: string
  notOfferedAsUe?: string
  extras?: Record<string, string>
  isCurrentSemester?: boolean
  latestYear?: string
  latestSemester?: string
}

export interface DbExam {
  date: string
  day: number
  start_time: string
  end_time: string
  key: string
  name: string
  duration?: number
}

export interface DbPrerequisiteNode {
  title: string
  requires: string[]
  requiredBy: string[]
}
