import fs from "fs/promises"
import path from "path"
import { NextRequest, NextResponse } from "next/server"

import { getLatestSemester } from "@/lib/server/get-latest-semester"

interface Module {
  code: string
  title: string
  au: string
  searchKeys?: string[]
  notAvailableToProgramme?: string
}

interface ModuleWithSemesterInfo extends Module {
  latestYear: string
  latestSemester: string
}

const METADATA_DIR = path.join(process.cwd(), "src/data/api/metadata")

async function loadAllModulesWithSemesterInfo(
  currentYear: string,
  currentSemester: string
): Promise<{
  modulesMap: Map<string, ModuleWithSemesterInfo>
  currentSemesterSet: Set<string>
}> {
  const files = await fs.readdir(METADATA_DIR)
  const jsonFiles = files.filter((f) => f.endsWith(".json")).sort() // ASC = chronological, latest wins

  const modulesMap = new Map<string, ModuleWithSemesterInfo>()
  const currentSemesterSet = new Set<string>()

  for (const file of jsonFiles) {
    const stem = file.replace(".json", "")
    const underscoreIdx = stem.indexOf("_")
    const fileYear = stem.slice(0, underscoreIdx)
    const fileSemester = stem.slice(underscoreIdx + 1)

    const data = await fs.readFile(path.join(METADATA_DIR, file), "utf-8")
    const obj = JSON.parse(data) as Record<string, Module>

    const isCurrentFile =
      fileYear === currentYear && fileSemester === currentSemester

    for (const [code, module] of Object.entries(obj)) {
      modulesMap.set(code, {
        ...module,
        code,
        latestYear: fileYear,
        latestSemester: fileSemester
      })

      if (isCurrentFile) {
        currentSemesterSet.add(code)
      }
    }
  }

  return { modulesMap, currentSemesterSet }
}

function moduleMatchesType(module: Module, type: string): boolean {
  return module.searchKeys?.some((k) => k.split(";")[0] === type) ?? false
}

/**
 * GET /api/data/modules
 * Returns paginated, server-side filtered list of modules across all semesters.
 *
 * Query params:
 *   year?     - YYYY — used to determine "current" semester for isCurrentSemester flag
 *   semester? - 1|2|S — used to determine "current" semester for isCurrentSemester flag
 *   skip      - pagination offset (default 0)
 *   limit     - page size (default 100, max 200)
 *   q?        - search query (code/title, case-insensitive)
 *   type?     - module type: CORE|GLOAD|MLOAD|GERP|CNY
 *   level?    - module level digit: 1-7
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const yearParam = searchParams.get("year")
    const semesterParam = searchParams.get("semester")
    const currentOnly = searchParams.get("currentOnly") === "true"
    const skip = parseInt(searchParams.get("skip") || "0", 10)
    const limit = Math.min(
      parseInt(searchParams.get("limit") || "100", 10),
      200
    )
    const q = searchParams.get("q")?.toLowerCase().trim() || null
    const type = searchParams.get("type") || null
    const level = searchParams.get("level") || null

    const { year: latestYear, semester: latestSemester } =
      await getLatestSemester()
    const currentYear = yearParam ?? latestYear
    const currentSemester = semesterParam ?? latestSemester

    const { modulesMap, currentSemesterSet } =
      await loadAllModulesWithSemesterInfo(currentYear, currentSemester)

    let modules = Array.from(modulesMap.values())

    // When year+semester are explicitly provided (e.g. /timetable), restrict to
    // that semester only — restoring the original single-semester behaviour.
    // Also filter when the /mods toggle is set to "current sem only".
    if ((yearParam && semesterParam) || currentOnly) {
      modules = modules.filter((m) => currentSemesterSet.has(m.code))
    }

    if (q && q.length > 0) {
      const isCodeQuery = /^[a-z]{2,4}\d*/i.test(q)
      if (isCodeQuery) {
        const codeMatches = modules.filter((m) =>
          m.code.toLowerCase().includes(q)
        )
        const titleMatches = modules.filter(
          (m) =>
            !m.code.toLowerCase().includes(q) &&
            m.title.toLowerCase().includes(q)
        )
        modules = [...codeMatches, ...titleMatches]
      } else {
        modules = modules.filter(
          (m) =>
            m.title.toLowerCase().includes(q) ||
            m.code.toLowerCase().includes(q)
        )
      }
    }

    if (type) {
      modules = modules.filter((m) => moduleMatchesType(m, type))
    }

    if (level) {
      modules = modules.filter((m) => m.code.slice(2, 3) === level)
    }

    if (!q) {
      modules.sort((a, b) => a.code.localeCompare(b.code))
    }

    const total = modules.length
    const pageModules = modules.slice(skip, skip + limit)

    const paginated = pageModules.map((m) => ({
      ...m,
      isCurrentSemester: currentSemesterSet.has(m.code)
    }))

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
