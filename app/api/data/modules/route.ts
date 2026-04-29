import fs from "fs/promises"
import path from "path"
import { NextResponse } from "next/server"

import { getLatestSemester } from "@/lib/server/get-latest-semester"

export const dynamic = "force-static"

interface Module {
  code: string
  title: string
  au: string
  searchKeys?: string[]
  notAvailableToProgramme?: string
  isCurrentSemester?: boolean
  latestYear?: string
  latestSemester?: string
}

const METADATA_DIR = path.join(process.cwd(), "src/data/api/metadata")

/**
 * GET /api/data/modules
 * Returns all modules across all semesters, sorted by code.
 * Statically generated at build time — no runtime function invocation.
 */
export async function GET() {
  const { year: latestYear, semester: latestSemester } =
    await getLatestSemester()

  const files = await fs.readdir(METADATA_DIR)
  const jsonFiles = files.filter((f) => f.endsWith(".json")).sort() // ASC = chronological, latest wins

  const modulesMap = new Map<string, Module>()
  const currentSemesterSet = new Set<string>()

  for (const file of jsonFiles) {
    const stem = file.replace(".json", "")
    const underscoreIdx = stem.indexOf("_")
    const fileYear = stem.slice(0, underscoreIdx)
    const fileSemester = stem.slice(underscoreIdx + 1)

    const data = await fs.readFile(path.join(METADATA_DIR, file), "utf-8")
    const obj = JSON.parse(data) as Record<string, Module>

    const isCurrentFile =
      fileYear === latestYear && fileSemester === latestSemester

    for (const [code, module] of Object.entries(obj)) {
      modulesMap.set(code, {
        ...module,
        code,
        latestYear: fileYear,
        latestSemester: fileSemester
      })
      if (isCurrentFile) currentSemesterSet.add(code)
    }
  }

  const modules = Array.from(modulesMap.values())
    .map((m) => ({ ...m, isCurrentSemester: currentSemesterSet.has(m.code) }))
    .sort((a, b) => a.code.localeCompare(b.code))

  return NextResponse.json({ modules })
}
