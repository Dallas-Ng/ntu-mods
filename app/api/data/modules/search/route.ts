import fs from "fs/promises"
import path from "path"
import { NextRequest, NextResponse } from "next/server"

interface Module {
  code: string
  title: string
  au: string
  searchKeys?: string[]
  notAvailableToProgramme?: string
}

/**
 * GET /api/data/modules/search
 * Searches modules by query string, returns max 50 results
 * Query params: year, semester, q (search query)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const year = searchParams.get("year")
    const semester = searchParams.get("semester")
    const query = searchParams.get("q")?.toLowerCase().trim()

    // Validate parameters
    if (!year || !semester) {
      return NextResponse.json(
        { error: "Missing required parameters: year and semester" },
        { status: 400 }
      )
    }

    if (!query || query.length < 1) {
      return NextResponse.json(
        { results: [], total: 0 },
        {
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300"
          }
        }
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
      return NextResponse.json({ results: [], total: 0 }, { status: 200 })
    }

    const data = await fs.readFile(metadataPath, "utf-8")
    const modulesObj = JSON.parse(data)

    // Search through modules
    const results: Module[] = []
    const MAX_RESULTS = 50

    for (const [code, module] of Object.entries(modulesObj)) {
      if (results.length >= MAX_RESULTS) break

      const moduleData = module as Module
      if (code.toLowerCase().includes(query)) {
        results.push({
          ...moduleData,
          code
        })
      }
    }

    return NextResponse.json(
      {
        results,
        total: results.length
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300"
        }
      }
    )
  } catch (error) {
    console.error("Error searching modules:", error)
    return NextResponse.json(
      { error: "Failed to search modules" },
      { status: 500 }
    )
  }
}
