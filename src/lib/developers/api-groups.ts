// Builds the REST API reference (grouped operations and field tables) from the
// OpenAPI document, so /developers/api and /developers/webmcp cannot drift from
// /developers/openapi.json. Build-time only: it reads the committed data.

import { buildOpenApi } from "@/lib/openapi"
import { getLatestExamSemester, getLatestSemester } from "@/lib/server/db/repo"
import type { ApiGroup } from "@/components/developers/api-explorer"

type Schema = Record<string, any>

export async function getApiGroups(): Promise<ApiGroup[]> {
  const { year, semester } = await getLatestSemester()
  const exams = await getLatestExamSemester()
  const spec = buildOpenApi({
    indexSemester: `${year}_${semester}`,
    examSemester: exams ? `${exams.year}_${exams.semester}` : null
  })

  const schemas = spec.components.schemas as Record<string, Schema>
  const resolve = (s: Schema): Schema =>
    s?.$ref ? schemas[s.$ref.split("/").pop() as string] : s

  const typeOf = (s: Schema): string => {
    if (s.$ref) return s.$ref.split("/").pop() as string
    if (s.oneOf) return s.oneOf.map(typeOf).join(" | ")
    if (s.type === "array") return `${typeOf(s.items ?? {})}[]`
    return Array.isArray(s.type) ? s.type.join(" | ") : (s.type ?? "any")
  }

  // Flattens an object schema one level deep into table rows.
  const fields = (schema: Schema, prefix = ""): [string, string, string][] =>
    Object.entries(resolve(schema).properties ?? {}).flatMap(([name, raw]) => {
      const prop = raw as Schema
      const inner = resolve(prop)
      if (!prefix && inner.type === "object" && inner.properties) {
        return [
          [name, "object", prop.description ?? ""],
          ...fields(inner, `${name}.`)
        ] as [string, string, string][]
      }
      return [[prefix + name, typeOf(prop), prop.description ?? ""]] as [
        string,
        string,
        string
      ][]
    })

  const moduleSchema = spec.paths["/api/modules/{code}"].get.responses["200"]
    .content["application/json"].schema as Schema

  // Field tables for the module API and the open data files, with where the
  // fields sit in the response. Discovery files have none.
  const FIELD_DOCS: Record<string, { schema: Schema; note?: string }> = {
    getModule: { schema: moduleSchema },
    getModuleList: {
      schema: schemas.ModuleList.properties.modules.items,
      note: "Each item in the `modules` array."
    },
    getIndexes: {
      schema: schemas.ClassSlot,
      note: "Each class slot, found at `{code}.{index}[]`."
    },
    getExams: {
      schema: schemas.Exam,
      note: "Each exam, found at `{code}`."
    }
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "UTC"
    })

  const LANG: Record<string, string> = {
    "application/json": "json",
    "text/markdown": "markdown",
    "text/plain": "text"
  }

  const groups: ApiGroup[] = spec.tags.map((tag) => ({
    name: tag.name,
    description: tag.description,
    ops: Object.entries(spec.paths).flatMap(([path, item]) => {
      const op = (item as Record<string, any>).get as Schema
      if (op.tags[0] !== tag.name) return []
      const [mediaType, media] = (Object.entries(
        op.responses["200"]?.content ?? {}
      )[0] ?? []) as [string | undefined, Schema | undefined]
      const isModule = op.operationId === "getModule"
      const fieldDocs = FIELD_DOCS[op.operationId]
      const examplePath = path.replace(
        /\{(\w+)\}/g,
        (_, name) =>
          op.parameters.find((p: Schema) => p.name === name).schema.example
      )
      return [
        {
          id: op.operationId,
          path,
          summary: op.summary,
          description: op.description,
          updated: formatDate(op["x-last-updated"]),
          params: (op.parameters ?? []).map((p: Schema) => ({
            name: p.name,
            where: p.in,
            description: p.description ?? p.schema.description ?? "",
            pattern: p.schema.pattern,
            example: p.schema.example
          })),
          responses: Object.entries(op.responses).map(([status, r]) => ({
            status,
            description: (r as Schema).description
          })),
          fields: fieldDocs ? fields(fieldDocs.schema) : undefined,
          fieldsNote: fieldDocs?.note,
          request: `curl ${spec.servers[0].url}${examplePath}`,
          response:
            media?.["x-example-text"] ??
            (media?.example
              ? JSON.stringify(media.example, null, 2)
              : undefined),
          responseLang: LANG[mediaType ?? ""] ?? "text",
          tryIt: isModule
        }
      ]
    })
  }))

  return groups
}
