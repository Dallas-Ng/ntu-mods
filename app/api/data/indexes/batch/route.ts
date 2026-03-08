import fs from "fs/promises"
import path from "path"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/data/indexes/batch
 * Returns class schedules for multiple modules in one request
 * Query params: modules (comma-separated codes), year, semester
 * Response: { [moduleCode]: { [indexKey]: Index[] } }
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const year = searchParams.get("year")
    const semester = searchParams.get("semester")
    const modulesParam = searchParams.get("modules")

    if (!year || !semester) {
      return NextResponse.json(
        { error: "Missing required parameters: year and semester" },
        { status: 400 }
      )
    }

    if (!modulesParam) {
      return NextResponse.json(
        { error: "Missing required parameter: modules" },
        { status: 400 }
      )
    }

    const codes = modulesParam
      .split(",")
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean)

    const indexesPath = path.join(
      process.cwd(),
      `src/data/api/indexes/${year}_${semester}.json`
    )

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

    const result: Record<string, Record<string, Index[]>> = {}
    for (const code of codes) {
      if (indexesObj[code]) {
        result[code] = indexesObj[code]
      }
    }

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800"
      }
    })
  } catch (error) {
    console.error("Error fetching batch indexes:", error)
    return NextResponse.json(
      { error: "Failed to fetch batch indexes" },
      { status: 500 }
    )
  }
}
