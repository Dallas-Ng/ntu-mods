import type { APIRoute } from "astro"
import { env, waitUntil } from "cloudflare:workers"

import { createPostHogClient } from "@/lib/posthog-server"

export const prerender = false

const MAX_FEEDBACK_LENGTH = 10_000
const MAX_LOCAL_DATA_LENGTH = 200_000

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  })
}

export const POST: APIRoute = async ({ request }) => {
  // Bindings, not process.env — Cloudflare only populates process.env through
  // nodejs_compat's process shim, which this worker deliberately runs an older
  // version of (see disable_nodejs_process_v2 in wrangler.jsonc). Astro v6
  // removed Astro.locals.runtime.env, so cloudflare:workers is the way in.
  const { RESEND_KEY, PUBLIC_POSTHOG_TOKEN } = env

  let data: unknown
  try {
    data = await request.json()
  } catch {
    return json({ success: false, error: "Invalid JSON body" }, 400)
  }

  const { feedback, author, distinctId, url, localData } = (data ?? {}) as {
    feedback?: unknown
    author?: unknown
    distinctId?: unknown
    url?: unknown
    localData?: unknown
  }

  if (typeof feedback !== "string" || feedback.trim() === "") {
    return json({ success: false, error: "Feedback is required" }, 400)
  }
  if (feedback.length > MAX_FEEDBACK_LENGTH) {
    return json({ success: false, error: "Feedback is too long" }, 400)
  }

  const authorLine = typeof author === "string" ? author : ""
  const posthogDistinctId = typeof distinctId === "string" ? distinctId : ""
  const pageUrl = typeof url === "string" ? url : ""
  const localDataLine =
    typeof localData === "string"
      ? localData.slice(0, MAX_LOCAL_DATA_LENGTH)
      : ""

  if (!RESEND_KEY) {
    console.error("Feedback: RESEND_KEY is not bound")
    return json({ success: false, error: "Feedback is not configured" }, 500)
  }

  const emailLines = [
    `From: ${authorLine}`,
    `PostHog distinct_id: ${posthogDistinctId || "unknown"}`,
    `Page: ${pageUrl || "unknown"}`,
    "",
    feedback
  ]
  if (localDataLine) {
    emailLines.push("", "--- Local data ---", localDataLine)
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${RESEND_KEY}`
    },
    body: JSON.stringify({
      from: "feedback@ntumods.com",
      to: "ngdallas1@gmail.com",
      subject: "New Feedback on NTU Mods",
      text: emailLines.join("\n")
    })
  })

  if (!res.ok) {
    const error = await res.text()
    console.error("Resend error:", error)
    return json({ success: false, error: "Failed to send feedback" }, 500)
  }

  if (PUBLIC_POSTHOG_TOKEN) {
    const posthog = createPostHogClient(PUBLIC_POSTHOG_TOKEN)
    posthog.capture({
      distinctId: posthogDistinctId || authorLine || "anonymous",
      event: "feedback_submitted",
      properties: {
        has_email: !!authorLine && authorLine !== "anon",
        feedback_length: feedback.length,
        $current_url: pageUrl || undefined
      }
    })
    // Flush after the response is sent instead of blocking on it.
    waitUntil(posthog.shutdown())
  }

  return json({ success: true }, 200)
}
