import fs from "fs/promises"
import path from "path"
import { NextRequest, NextResponse } from "next/server"

import { getModuleIndexesData } from "@/lib/server/get-module-indexes-data"

/**
 * GET /api/data/modules/random
 * Returns a random module with a random class index slot
 * Query params: year, semester
 * Response: { code, title, au, indexKey, index: Index }
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams

  try {
    const year = searchParams.get("year") ?? "2025"
    const semester = searchParams.get("semester") ?? "2"

    const metadataPath = path.join(
      process.cwd(),
      `src/data/api/metadata/${year}_${semester}.json`
    )

    let metadataObj: Record<
      string,
      { title: string; au: string; searchKeys: string[] }
    >
    try {
      const data = await fs.readFile(metadataPath, "utf-8")
      metadataObj = JSON.parse(data)
    } catch {
      return NextResponse.json({ error: "No data available" }, { status: 404 })
    }

    const indexesPath = path.join(
      process.cwd(),
      `src/data/api/indexes/${year}_${semester}.json`
    )
    let indexesObj: Record<string, Record<string, Index[]>>
    try {
      const data = await fs.readFile(indexesPath, "utf-8")
      indexesObj = JSON.parse(data)
    } catch {
      return NextResponse.json(
        { error: "No indexes available" },
        { status: 404 }
      )
    }

    // Only consider modules that have at least one index with valid slots
    const eligibleCodes = Object.keys(metadataObj).filter((code) => {
      const moduleIndexes = indexesObj[code]
      if (!moduleIndexes) return false
      return Object.values(moduleIndexes).some((slots) =>
        slots.some((s) => s.day !== 0)
      )
    })

    if (!eligibleCodes.length) {
      return NextResponse.json(
        { error: "No eligible modules" },
        { status: 404 }
      )
    }

    let code: string
    let indexKey: string
    let index: Index | undefined

    // Pick random module + index until we find a valid slot
    let attempts = 0
    do {
      code = eligibleCodes[Math.floor(Math.random() * eligibleCodes.length)]
      const moduleIndexes = await getModuleIndexesData(code, year, semester)
      const keys = Object.keys(moduleIndexes)
      if (!keys.length) continue
      indexKey = keys[Math.floor(Math.random() * keys.length)]
      const slots = moduleIndexes[indexKey]
      index = slots?.[0]
      attempts++
    } while (!index && attempts < 20)

    if (!index!) {
      return NextResponse.json(
        { error: "Could not find random module" },
        { status: 500 }
      )
    }

    const meta = metadataObj[code!]

    return NextResponse.json(
      {
        code: code!,
        title: meta.title,
        au: meta.au,
        indexKey: indexKey!,
        index
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300"
        }
      }
    )
  } catch (error) {
    console.error("Error fetching random module:", error)
    return NextResponse.json(
      { error: "Failed to fetch random module" },
      { status: 500 }
    )
  }
}
