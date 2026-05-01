import fs from "fs/promises"
import path from "path"
import { NextRequest, NextResponse } from "next/server"

interface Index {
  key: string
  type: string
  group: string
  day: number
  time: string
  venue: string
  remarks?: string
  duration: number
}

/**
 * GET /api/data/modules/[code]/indexes
 * Returns class schedules for a specific module
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

    // Validate parameters
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

    const indexesPath = path.join(
      process.cwd(),
      `src/data/api/indexes/${year}_${semester}.json`
    )

    // Check if file exists
    try {
      await fs.access(indexesPath)
    } catch {
      return NextResponse.json(
        { error: `No data available for ${year} semester ${semester}` },
        { status: 404 }
      )
    }

    const data = await fs.readFile(indexesPath, "utf-8")
    const indexesObj = JSON.parse(data)
    const moduleIndexes = indexesObj[code]

    if (!moduleIndexes) {
      // Module might not have any indexes in this semester
      return NextResponse.json(
        { indexes: [] },
        {
          headers: {
            "Cache-Control":
              "public, s-maxage=86400, stale-while-revalidate=604800"
          }
        }
      )
    }

    return NextResponse.json(
      { indexes: moduleIndexes },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=86400, stale-while-revalidate=604800"
        }
      }
    )
  } catch (error) {
    console.error("Error fetching module indexes:", error)
    return NextResponse.json(
      { error: "Failed to fetch module indexes" },
      { status: 500 }
    )
  }
}
