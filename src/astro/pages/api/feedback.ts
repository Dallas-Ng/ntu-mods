import type { APIRoute } from "astro"

import { getPostHogClient } from "@/lib/posthog-server"

export const prerender = false

interface Data {
  feedback: string
  author: string
}

export const POST: APIRoute = async ({ request }) => {
  const data: Data = await request.json()

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

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } else {
    const error = await res.json()
    console.error("Resend error:", error)
    return new Response(JSON.stringify({ success: false, error }), {
      status: 500
    })
  }
}
