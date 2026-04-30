import { NextRequest, NextResponse } from "next/server"

import { getSemesterExamsData } from "@/lib/server/get-module-exam-data"

/**
 * GET /api/data/exams
 * Returns exam timetable for a semester keyed by module code.
 * Query params: year, semester
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  try {
    const year = searchParams.get("year")
    const semester = searchParams.get("semester")

    if (!year || !semester) {
      return NextResponse.json(
        { error: "Missing required parameters: year and semester" },
        { status: 400 }
      )
    }

    const exams = await getSemesterExamsData(year, semester)

    return NextResponse.json(
      { exams },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=86400, stale-while-revalidate=604800"
        }
      }
    )
  } catch (error) {
    console.error("Error fetching semester exams:", error)
    return NextResponse.json(
      { error: "Failed to fetch exams" },
      { status: 500 }
    )
  }
}
