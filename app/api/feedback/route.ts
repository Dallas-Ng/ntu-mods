import { NextResponse } from "next/server"

interface Data {
  feedback: string
  author: string
}

export async function POST(req: Request) {
  const data: Data = await req.json()

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: "feedback@ntumods.com",
      to: "ngdallas1@gmail.com",
      subject: "New Feedback on NTU Mods",
      text: `From: ${data.author}\n\n${data.feedback}`
    })
  })

  if (res.ok) {
    return NextResponse.json({ success: true }, { status: 200 })
  } else {
    const error = await res.json()
    console.error("Resend error:", error)
    return NextResponse.json({ success: false, error }, { status: 500 })
  }
}
