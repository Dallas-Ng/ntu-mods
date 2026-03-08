import fs from "fs/promises"
import path from "path"
import { NextResponse } from "next/server"

import { getIcs } from "@/lib/get-ics"

const handleFailure = (warningText: string, objToLog?: Record<string, any>) => {
  console.error(warningText)
  console.info(objToLog)
  return NextResponse.json({}, { status: 500 })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  // Get year and semester params (default to 2025;1)
  const year = searchParams.get("year") || "2025"
  const semester = searchParams.get("semester") || "1"

  // Extract timetable entries (exclude year and semester params)
  const timetableEntries = Array.from(searchParams.entries()).filter(
    ([key]) => key !== "year" && key !== "semester"
  )

  // Check if the timetable is empty
  if (timetableEntries.length === 0) {
    return handleFailure("Empty timetable")
  }

  // Load indexes for the specified year/semester
  const indexesPath = path.join(
    process.cwd(),
    `src/data/api/indexes/${year}_${semester}.json`
  )

  let moduleIndexes: Record<string, Record<string, Index[]>>

  try {
    const indexesData = await fs.readFile(indexesPath, "utf-8")
    moduleIndexes = JSON.parse(indexesData)
  } catch {
    return handleFailure(
      `Failed to load indexes for ${year} semester ${semester}`
    )
  }

  const timetable: Timetable = {}

  // Validate module key and index key, build flat indexLookup
  const indexLookup: Record<string, Index[]> = {}
  for (const [key, value] of timetableEntries) {
    if (!(key in moduleIndexes) || !(value in moduleIndexes[key])) {
      return handleFailure("Invalid module key or index key", {
        year,
        semester,
        key,
        value
      })
    }
    timetable[key] = value
    indexLookup[value] = moduleIndexes[key][value]
  }

  // Load module titles for event descriptions
  const titleLookup: Record<string, string> = {}
  try {
    const metadataPath = path.join(
      process.cwd(),
      `src/data/api/metadata/${year}_${semester}.json`
    )
    const metaData = await fs.readFile(metadataPath, "utf-8")
    const metaObj = JSON.parse(metaData) as Record<string, { title: string }>
    for (const code of Object.keys(timetable)) {
      if (metaObj[code]) titleLookup[code] = metaObj[code].title
    }
  } catch {
    // titles are optional — proceed without them
  }

  const icsText = getIcs(timetable, indexLookup, titleLookup)
  if (icsText) {
    return NextResponse.json({ icsText }, { status: 200 })
  } else {
    return handleFailure("Empty ICS File", { icsText })
  }
}
