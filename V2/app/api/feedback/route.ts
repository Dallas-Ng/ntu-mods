import { NextResponse } from "next/server"
import { sql } from "@vercel/postgres"

interface Data {
  feedback: string
  category: string
  author: string
}

export async function POST(req: Request) {
  const data: Data = await req.json()

  const { rowCount } = await sql`
    INSERT INTO table_feedback
        (feedback, category, author)
    VALUES
        (${data.feedback}, ${data.category}, ${data.author})
    RETURNING *;
  `

  if (rowCount > 0) {
    return NextResponse.json({ success: true }, { status: 200 })
  } else {
    return NextResponse.json({ success: false }, { status: 500 })
  }
}
