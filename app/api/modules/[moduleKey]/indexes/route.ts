import { apiGetJsonFile } from "@/lib/api-get-json-file"
import { apiGetMetadata } from "@/lib/api-get-metadata"
import { IS_DEV } from "@/lib/constants"

export async function GET(
  req: Request,
  { params }: { params: { moduleKey: string } }
) {
  const { searchParams } = new URL(req.url)
  const { moduleKey } = params

  if (!moduleKey) return new Response("Not found", { status: 404 })

  const { acadYear, semester } = apiGetMetadata(searchParams)

  const moduleData = await apiGetJsonFile<ModuleIndexJsonFile>(
    `/indexes/aggregated-${acadYear}-${semester}.json`
  )
  if (!moduleData) return new Response("Not found", { status: 404 })

  const moduleIndexes = moduleData[moduleKey] ?? null

  return Response.json({
    ...(IS_DEV && {
      __dev: {
        semester,
        acadYear
      }
    }),
    total: Object.values(moduleIndexes).length,
    indexes: moduleIndexes
  })
}
