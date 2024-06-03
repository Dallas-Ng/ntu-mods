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

  const limit = parseInt(searchParams.get("limit") ?? "6")

  const moduleData = await apiGetJsonFile<ModuleJsonFile>(
    `/course-modules/processed-${acadYear}-${semester}.json`
  )
  if (!moduleData) return new Response("Not found", { status: 404 })

  const keyPrefix = moduleKey.slice(0, 2)

  const modules = Object.entries(moduleData)

  const modulesToReturn = modules
    .filter(([k]) => k.slice(0, 2) === keyPrefix && k !== moduleKey)
    .flatMap((x) => x[1])
    .sort((a, b) => parseInt(a.code.slice(2)) - parseInt(b.code.slice(2)))
    .slice(0, limit)

  return Response.json({
    ...(IS_DEV && {
      __dev: {
        semester,
        acadYear
      }
    }),
    related: modulesToReturn
  })
}
