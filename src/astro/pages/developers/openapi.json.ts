import type { APIRoute } from "astro"

import { buildOpenApi } from "@/lib/openapi"
import { getLatestExamSemester, getLatestSemester } from "@/lib/server/db/repo"

export const prerender = true

export const GET: APIRoute = async () => {
  const { year, semester } = await getLatestSemester()
  const exams = await getLatestExamSemester()

  return new Response(
    JSON.stringify(
      buildOpenApi({
        indexSemester: `${year}_${semester}`,
        examSemester: exams ? `${exams.year}_${exams.semester}` : null
      }),
      null,
      2
    ),
    { headers: { "Content-Type": "application/json; charset=utf-8" } }
  )
}
