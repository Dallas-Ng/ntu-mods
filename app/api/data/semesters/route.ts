import fs from "fs/promises"
import path from "path"
import { NextResponse } from "next/server"
import { getLatestSemester } from "@/lib/server/get-latest-semester"

/**
 * GET /api/data/semesters
 * Returns all available academic semesters
 */
export async function GET() {
  try {
    const semestersPath = path.join(
      process.cwd(),
      "src/data/api/semesters.json"
    )
    const data = await fs.readFile(semestersPath, "utf-8")
    const semesters = JSON.parse(data)

    const latest = await getLatestSemester()
    const latestSemester = `${latest.year};${latest.semester}`

    return NextResponse.json(
      {
        semesters,
        latestSemester
      },
      {
        headers: {
          "Cache-Control":
            "public, s-maxage=86400, stale-while-revalidate=604800"
        }
      }
    )
  } catch (error) {
    console.error("Error fetching semesters:", error)
    return NextResponse.json(
      { error: "Failed to fetch semesters" },
      { status: 500 }
    )
  }
}
