import { apiGetJsonFile } from "@/lib/api-get-json-file"
import { apiGetMetadata } from "@/lib/api-get-metadata"
import { IS_DEV } from "@/lib/constants"

export async function GET(
  req: Request,
  { params }: { params: { moduleKey: string } }
) {
  const { searchParams } = new URL(req.url)
  const { moduleKey } = params

  const { acadYear, semester } = apiGetMetadata(searchParams)

  const moduleData = await apiGetJsonFile<ModuleJsonFile>(
    `/course-modules/processed-${acadYear}-${semester}.json`
  )
  if (!moduleData) return new Response("Not found", { status: 404 })

  return Response.json({
    ...(IS_DEV && {
      __dev: {
        semester,
        acadYear
      }
    }),
    module: moduleData[moduleKey] ?? null
  })
}
