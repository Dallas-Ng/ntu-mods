import fs from "fs/promises"
import path from "path"
import { NextRequest, NextResponse } from "next/server"

/**
 * GET /api/data/modules/[code]
 * Returns details for a specific module
 * Query params: year, semester
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
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

    const metadataPath = path.join(
      process.cwd(),
      `src/data/api/metadata/${year}_${semester}.json`
    )

    // Check if file exists
    try {
      await fs.access(metadataPath)
    } catch {
      return NextResponse.json(
        { error: `No data available for ${year} semester ${semester}` },
        { status: 404 }
      )
    }

    const data = await fs.readFile(metadataPath, "utf-8")
    const modulesObj = JSON.parse(data)
    const moduleData = modulesObj[code]

    if (!moduleData) {
      return NextResponse.json({ error: "Module not found" }, { status: 404 })
    }

    return NextResponse.json(
      { ...moduleData, code },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=86400, stale-while-revalidate=604800"
        }
      }
    )
  } catch (error) {
    console.error("Error fetching module:", error)
    return NextResponse.json(
      { error: "Failed to fetch module" },
      { status: 500 }
    )
  }
}
