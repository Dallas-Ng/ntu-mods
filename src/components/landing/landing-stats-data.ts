import {
  getAllModuleMetadata,
  getModuleSemesters,
  getSemesterCounts
} from "@/lib/server/db/repo"

export type SemesterStats = {
  modules: number
  indexes: number
  newModules: number
  bdeModules: number
}

// Everything is derived from the data, so it stays right when a semester loads.
export const getSemesterStats = async (
  year: string,
  semester: string
): Promise<SemesterStats> => {
  const [{ modules, indexes }, metadata] = await Promise.all([
    getSemesterCounts(year, semester),
    getAllModuleMetadata(year, semester)
  ])
  const codes = Object.keys(metadata)

  // New = no earlier semester in the data ever offered the module
  const history = await Promise.all(codes.map((c) => getModuleSemesters(c)))
  const newModules = history.filter((h) => h.length === 1).length

  // Modules the semester offers as BDEs (the GLOAD tag)
  const bdeModules = Object.values(metadata).filter((m) =>
    m.searchKeys.some((k) => k.startsWith("GLOAD"))
  ).length

  return { modules, indexes, newModules, bdeModules }
}
