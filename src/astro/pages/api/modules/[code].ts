import type { APIRoute } from "astro"

import { ON_DEMAND_CACHE_CONTROL } from "@/lib/edge-cache"
import { getLatestModuleSnapshot } from "@/lib/server/edge/get-module-snapshot"

export const prerender = false

const headers = {
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": "*"
}

/**
 * One module as JSON: the record behind /mods/CODE. Read by the WebMCP
 * get_module tool and listed in ai-catalog.json. Read-only, no personal data.
 */
export const GET: APIRoute = async ({ params }) => {
  const code = (params.code ?? "").toUpperCase()
  const snapshot = await getLatestModuleSnapshot(code)

  if (!snapshot) {
    return new Response(JSON.stringify({ error: `No module ${code}` }), {
      status: 404,
      headers
    })
  }

  const { moduleData, indexes, exam, year, semester, prereqNode } = snapshot

  return new Response(
    JSON.stringify({
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
        isCurrentSemester: snapshot.isCurrentOffering,
        indexCount: Object.keys(indexes).length
      },
      otherSemesters: snapshot.otherSemesters,
      exam,
      url: `https://ntumods.com/mods/${moduleData.code}`
    }),
    { headers: { ...headers, "Cache-Control": ON_DEMAND_CACHE_CONTROL } }
  )
}
