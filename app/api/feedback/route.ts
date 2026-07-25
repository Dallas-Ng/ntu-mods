import { NextResponse } from "next/server"

import { getPostHogClient } from "@/lib/posthog-server"

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
      Authorization: `Bearer ${process.env.RESEND_KEY}`
    },
    body: JSON.stringify({
      from: "feedback@ntumods.com",
      to: "ngdallas1@gmail.com",
      subject: "New Feedback on NTU Mods",
      text: `From: ${data.author}\n\n${data.feedback}`
    })
  })

  if (res.ok) {
    const posthog = getPostHogClient()
    posthog.capture({
      distinctId: data.author || "anonymous",
      event: "feedback_submitted",
      properties: {
        has_email: !!data.author && data.author !== "anon",
        feedback_length: data.feedback.length
      }
    })
    await posthog.shutdown()

    return NextResponse.json({ success: true }, { status: 200 })
  } else {
    const error = await res.json()
    console.error("Resend error:", error)
    return NextResponse.json({ success: false, error }, { status: 500 })
  }
}
