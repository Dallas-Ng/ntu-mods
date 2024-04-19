import { apiGetJsonFile } from "@/lib/api-get-json-file"
import { apiGetMetadata } from "@/lib/api-get-metadata"
import { IS_DEV } from "@/lib/constants"

export async function GET(
  req: Request,
  { params }: { params: { moduleKey: string; indexKey: string } }
) {
  const { searchParams } = new URL(req.url)
  const { moduleKey, indexKey } = params

  if (!moduleKey) return new Response("Not found", { status: 404 })

  const { acadYear, semester } = apiGetMetadata(searchParams)

  const moduleData = await apiGetJsonFile<ModuleIndexJsonFile>(
    `/indexes/aggregated-${acadYear}-${semester}.json`
  )
  if (!moduleData) return new Response("Not found", { status: 404 })

  const moduleIndexes = moduleData[moduleKey]
  if (!moduleIndexes) return new Response("Not found", { status: 404 })

  const moduleIndex =
    moduleIndexes[indexKey as keyof typeof moduleIndexes] ?? null

  return Response.json({
    ...(IS_DEV && {
      __dev: {
        semester,
        acadYear
      }
    }),
    total: Object.values(moduleIndex).length,
    indexes: moduleIndex
  })
}
