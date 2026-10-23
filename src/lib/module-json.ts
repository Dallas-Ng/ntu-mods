import type { ModuleFullSnapshot } from "@/lib/server/edge/get-module-snapshot"

/**
 * One module as the public JSON record: what GET /api/modules/:code and the
 * MCP get_module tool both return, so the two cannot drift.
 */
export function toModuleJson({
  moduleData,
  indexes,
  exam,
  year,
  semester,
  prereqNode,
  isCurrentOffering,
  otherSemesters
}: ModuleFullSnapshot) {
  return {
    code: moduleData.code,
    title: moduleData.title,
    au: Number(moduleData.au),
    description: moduleData.description ?? null,
    gradeType: moduleData.gradeType ?? null,
    school: moduleData.faculty || null,
    categories: moduleData.categories ?? [],
    // Groups: every group must be met, and any module in a group meets it.
    prerequisites: moduleData.prerequisite ?? [],
    requires: prereqNode?.requires ?? [],
    requiredBy: prereqNode?.requiredBy ?? [],
    mutuallyExclusiveWith: moduleData.mutuallyExclusiveWith ?? [],
    restrictions: {
      notAvailableToProgramme: moduleData.notAvailableToProgramme ?? null,
      notAvailableToAllProgrammeWith:
        moduleData.notAvailableToAllProgrammeWith ?? null,
      notAvailableAsCore: moduleData.notAvailableAsCoreToProgramme ?? null,
      notAvailableAsPe: moduleData.notAvailableAsPeToProgramme ?? null,
      notAvailableAsBdeUe: moduleData.notAvailableAsBdeueToProgramme ?? null
    },
    latestOffering: {
      year,
      semester,
      isCurrentSemester: isCurrentOffering,
      indexCount: Object.keys(indexes).length
    },
    otherSemesters,
    exam,
    url: `https://ntumods.com/mods/${moduleData.code}`
  }
}
