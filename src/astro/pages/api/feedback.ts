import type { APIRoute } from "astro"
import { env, waitUntil } from "cloudflare:workers"

import type { AnalyticsEvent } from "@/lib/analytics-events"
import { createPostHogClient, reportServerError } from "@/lib/posthog-server"
import { bodyTooLarge, isCrossSite, rateLimit } from "@/lib/server/guard"

export const prerender = false

const MAX_FEEDBACK_LENGTH = 10_000
const MAX_LOCAL_DATA_LENGTH = 200_000

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" }
  })
}

// Feedback text plus the optional local-data dump, with room for JSON escaping.
const MAX_BODY_BYTES = 500_000

export const POST: APIRoute = async ({ request }) => {
  // Each accepted request sends an email, so refuse cross-site, oversized and
  // repeated posts before doing any work.
  if (isCrossSite(request))
    return json({ success: false, error: "Forbidden" }, 403)
  if (bodyTooLarge(request, MAX_BODY_BYTES)) {
    return json({ success: false, error: "Request too large" }, 413)
  }
  const limited = await rateLimit("FEEDBACK_LIMITER", request)
  if (limited) return limited

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
    reportServerError(
      PUBLIC_POSTHOG_TOKEN,
      waitUntil,
      "feedback",
      new Error("RESEND_KEY is not bound")
    )
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
      subject: "New Feedback on NTUMods",
      text: emailLines.join("\n")
    })
  })

  if (!res.ok) {
    const error = await res.text()
    reportServerError(
      PUBLIC_POSTHOG_TOKEN,
      waitUntil,
      "feedback",
      new Error(`Resend ${res.status}: ${error.slice(0, 500)}`)
    )
    return json({ success: false, error: "Failed to send feedback" }, 500)
  }

  // Only with an ID from the visitor's own PostHog, which exists only once
  // they have consented where that is required.
  if (PUBLIC_POSTHOG_TOKEN && posthogDistinctId) {
    const posthog = createPostHogClient(PUBLIC_POSTHOG_TOKEN)
    posthog.capture({
      distinctId: posthogDistinctId,
      event: "feedback_submitted" satisfies AnalyticsEvent,
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
