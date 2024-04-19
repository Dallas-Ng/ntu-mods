import { apiGetJsonFile } from "@/lib/api-get-json-file"
import { apiGetMetadata } from "@/lib/api-get-metadata"
import { IS_DEV } from "@/lib/constants"
import { getModuleCategories } from "@/lib/get-module-category"
import { getModuleFaculty } from "@/lib/get-module-faculty"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  const { acadYear, semester } = apiGetMetadata(searchParams)

  const searchTerm = searchParams.get("searchTerm")
  const moduleType = searchParams.get("type")
  const moduleFaculty = searchParams.get("faculty")
  const moduleLevel = searchParams.get("level")
  const page = parseInt(searchParams.get("page") ?? "1")
  const limit = parseInt(searchParams.get("limit") || "100")

  const moduleData = await apiGetJsonFile<ModuleJsonFile>(
    `/course-modules/processed-${acadYear}-${semester}.json`
  )
  if (!moduleData) return new Response("Not found", { status: 404 })

  let filteredModules = Object.entries(moduleData)

  if (searchTerm) {
    const lSearchTerm = searchTerm.toLocaleLowerCase()

    if (lSearchTerm.length === 2) {
      filteredModules = filteredModules.filter(([k]) =>
        k.toLocaleLowerCase().startsWith(lSearchTerm)
      )
    } else {
      filteredModules = filteredModules.filter(
        ([k, v]) =>
          k.toLocaleLowerCase().includes(lSearchTerm) ||
          v.title.toLocaleLowerCase().includes(lSearchTerm)
      )
    }
  }

  if (moduleType) {
    filteredModules = filteredModules.filter(([_, moduleData]) =>
      getModuleCategories(moduleData.searchKeys).includes(
        moduleType as ModuleType
      )
    )
  }

  if (moduleFaculty) {
    filteredModules = filteredModules.filter(
      ([_, moduleData]) =>
        getModuleFaculty(moduleData.searchKeys) === moduleFaculty
    )
  }

  if (moduleLevel) {
    filteredModules = filteredModules.filter(
      ([moduleKey, _]) => moduleKey.slice(2, 3) === moduleLevel
    )
  }

  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit

  const moduleToReturn = Object.values(filteredModules)
    .flatMap((x) => x[1])
    .sort((a, b) => a.code.localeCompare(b.code))
    .slice(startIndex, endIndex)

  return Response.json({
    ...(IS_DEV && {
      __dev: {
        semester,
        acadYear,
        searchTerm,
        moduleType,
        moduleFaculty,
        moduleLevel,
        page,
        limit
      }
    }),
    // Keep total on top so its easier to view/debug
    total: filteredModules.length,
    modules: moduleToReturn
  })
}
