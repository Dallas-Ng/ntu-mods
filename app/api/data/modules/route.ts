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

const METADATA_DIR = path.join(process.cwd(), "src/data/api/metadata")

async function loadAllModules(): Promise<Map<string, Module>> {
  const files = await fs.readdir(METADATA_DIR)
  const jsonFiles = files.filter((f) => f.endsWith(".json")).sort() // ASC = chronological, latest wins

  const merged = new Map<string, Module>()
  for (const file of jsonFiles) {
    const data = await fs.readFile(path.join(METADATA_DIR, file), "utf-8")
    const obj = JSON.parse(data) as Record<string, Module>
    for (const [code, module] of Object.entries(obj)) {
      merged.set(code, { ...module, code })
    }
  }
  return merged
}

async function loadSemesterModules(
  year: string,
  semester: string
): Promise<Map<string, Module>> {
  const filePath = path.join(METADATA_DIR, `${year}_${semester}.json`)
  try {
    await fs.access(filePath)
  } catch {
    return new Map()
  }
  const data = await fs.readFile(filePath, "utf-8")
  const obj = JSON.parse(data) as Record<string, Module>
  const map = new Map<string, Module>()
  for (const [code, module] of Object.entries(obj)) {
    map.set(code, { ...module, code })
  }
  return map
}

function moduleMatchesType(module: Module, type: string): boolean {
  return (
    module.searchKeys?.some((k) => k.split(";")[0] === type) ?? false
  )
}

/**
 * GET /api/data/modules
 * Returns paginated, server-side filtered list of modules.
 *
 * Query params:
 *   year?     - YYYY (omit for all years)
 *   semester? - 1|2|S (omit for all semesters)
 *   skip      - pagination offset (default 0)
 *   limit     - page size (default 100, max 200)
 *   q?        - search query (code/title, case-insensitive)
 *   type?     - module type: CORE|GLOAD|MLOAD|GERP|CNY
 *   level?    - module level digit: 1-7
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const year = searchParams.get("year")
    const semester = searchParams.get("semester")
    const skip = parseInt(searchParams.get("skip") || "0", 10)
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "100", 10),
      200
    )
    const q = searchParams.get("q")?.toLowerCase().trim() || null
    const type = searchParams.get("type") || null
    const level = searchParams.get("level") || null

    let modulesMap: Map<string, Module>

    if (year && semester) {
      modulesMap = await loadSemesterModules(year, semester)
      if (modulesMap.size === 0) {
        return NextResponse.json(
          { error: `No data available for ${year} semester ${semester}` },
          { status: 404 }
        )
      }
    } else {
      modulesMap = await loadAllModules()
    }

    let modules = Array.from(modulesMap.values())

    if (q && q.length > 0) {
      modules = modules.filter(
        (m) =>
          m.code.toLowerCase().includes(q) ||
          m.title.toLowerCase().includes(q)
      )
    }

    if (type) {
      modules = modules.filter((m) => moduleMatchesType(m, type))
    }

    if (level) {
      modules = modules.filter((m) => m.code.slice(2, 3) === level)
    }

    const total = modules.length
    const paginated = modules.slice(skip, skip + limit)

    return NextResponse.json(
      {
        modules: paginated,
        total,
        hasMore: skip + limit < total,
        page: Math.floor(skip / limit)
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400"
        }
      }
    )
  } catch (error) {
    console.error("Error fetching modules:", error)
    return NextResponse.json(
      { error: "Failed to fetch modules" },
      { status: 500 }
    )
  }
}
