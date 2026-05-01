import { NextRequest, NextResponse } from "next/server"

import { getModuleExamData } from "@/lib/server/get-module-exam-data"

/**
 * GET /api/data/modules/[code]/exam
 * Returns exam data for a specific module.
 * Query params: year, semester
 */
export async function GET(
  request: NextRequest,
  props: { params: Promise<{ code: string }> }
) {
  const params = await props.params
  const searchParams = request.nextUrl.searchParams

  try {
    const year = searchParams.get("year")
    const semester = searchParams.get("semester")
    const code = params.code?.toUpperCase()

    if (!year || !semester) {
      return NextResponse.json(
        { error: "Missing required parameters: year and semester" },
        { status: 400 }
      )
    }

    if (!code) {
      return NextResponse.json(
        { error: "Missing module code" },
        { status: 400 }
      )
    }

    const exam = await getModuleExamData(code, year, semester)

    return NextResponse.json(
      { exam },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=86400, stale-while-revalidate=604800"
        }
      }
    )
  } catch (error) {
    console.error("Error fetching module exam:", error)
    return NextResponse.json(
      { error: "Failed to fetch module exam" },
      { status: 500 }
    )
  }
}
