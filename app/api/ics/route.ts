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

  let indexes: Record<string, any>

  try {
    const indexesData = await fs.readFile(indexesPath, "utf-8")
    indexes = JSON.parse(indexesData)
  } catch (error) {
    return handleFailure(
      `Failed to load indexes for ${year} semester ${semester}`
    )
  }

  const timetable: Timetable = {}

  // Check if the module key and index key are valid
  for (const [key, value] of timetableEntries) {
    if (!(key in indexes) || !(value in indexes[key])) {
      return handleFailure("Invalid module key or index key", {
        year,
        semester,
        key,
        value
      })
    }

    timetable[key] = value
  }

  const icsText = getIcs(timetable)
  if (icsText) {
    return NextResponse.json({ icsText }, { status: 200 })
  } else {
    return handleFailure("Empty ICS File", { icsText })
  }
}
