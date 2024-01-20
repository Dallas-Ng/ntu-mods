import { NextResponse } from "next/server"
import { M_INDEXES } from "@/data/2023/m-indexes"

import { getIcs } from "@/lib/get-ics"

const handleFailure = (warningText: string, objToLog?: Record<string, any>) => {
  console.error(warningText)
  console.info(objToLog)
  return NextResponse.json({}, { status: 500 })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const obj = Object.fromEntries(searchParams.entries())

  // Check if the query string is empty
  if (Object.keys(obj).length === 0) {
    handleFailure("Empty query string")
  }

  const timetable: Timetable = {}

  // Check if the module key and index key are valid
  Object.entries(obj).forEach(([key, value]) => {
    if (!(key in M_INDEXES) || !(value in M_INDEXES[key])) {
      handleFailure("Invalid module key or index key", obj)
    }

    timetable[key] = value
  })

  const icsText = getIcs(timetable)
  if (icsText) {
    return NextResponse.json({ icsText }, { status: 200 })
  } else {
    handleFailure("Empty ICS File", { icsText })
  }

  return NextResponse.json({ timetable }, { status: 200 })
}
