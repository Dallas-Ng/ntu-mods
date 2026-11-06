import { describe, expect, it } from "vitest"

import {
  describeFeedbackFailure,
  FEEDBACK_SEND_FAILED_MESSAGE,
  FEEDBACK_TOO_SHORT_MESSAGE,
  FeedbackSubmitError,
  MIN_FEEDBACK_LENGTH,
  validateFeedback
} from "@/lib/feedback"

const form = (feedback: string) => ({
  email: "",
  feedback,
  includeLocalData: true
})

describe("feedback form", () => {
  it("returns a field error for a message that is too short", () => {
    const { errors } = validateFeedback(form("too short"))

    expect(errors).toEqual({ feedback: FEEDBACK_TOO_SHORT_MESSAGE })
    expect(FEEDBACK_TOO_SHORT_MESSAGE).toBe(
      `Feedback must be at least ${MIN_FEEDBACK_LENGTH} characters long.`
    )
  })

  it("does not count whitespace towards the minimum", () => {
    const { errors } = validateFeedback(form(" ".repeat(MIN_FEEDBACK_LENGTH)))

    expect(errors.feedback).toBe(FEEDBACK_TOO_SHORT_MESSAGE)
  })

  it("accepts a real message and trims it", () => {
    const { errors, values } = validateFeedback(
      form("  the timetable export is great  ")
    )

    expect(errors).toEqual({})
    expect(values.feedback).toBe("the timetable export is great")
  })

  it("keeps the other fields as they were", () => {
    const { values } = validateFeedback({
      email: "me@example.com",
      feedback: "a long enough message",
      includeLocalData: false
    })

    expect(values.email).toBe("me@example.com")
    expect(values.includeLocalData).toBe(false)
  })
})

describe("describeFeedbackFailure", () => {
  const response = (status: number, statusText = "") => ({
    status,
    statusText
  })

  it("keeps the server's own reason in the reported message", () => {
    const failure = describeFeedbackFailure(
      response(500, "Internal Server Error"),
      JSON.stringify({ success: false, error: "Feedback is not configured" })
    )

    expect(failure.message).toBe(
      "Feedback request failed (500 Internal Server Error): Feedback is not configured"
    )
    expect(failure.userMessage).toBe(FEEDBACK_SEND_FAILED_MESSAGE)
  })

  it("does not leave a dangling space when HTTP/2 omits the status text", () => {
    const failure = describeFeedbackFailure(response(500), "")

    expect(failure.message).toBe("Feedback request failed (500)")
  })

  it("asks the visitor to wait when rate limited", () => {
    const failure = describeFeedbackFailure(
      response(429, "Too Many Requests"),
      JSON.stringify({ error: "Rate limit exceeded. Retry in a minute." })
    )

    expect(failure.message).toContain("Rate limit exceeded")
    expect(failure.userMessage).toMatch(/wait a minute/i)
  })

  it("points oversized submissions at the local data toggle", () => {
    const failure = describeFeedbackFailure(
      response(413),
      JSON.stringify({ error: "Request too large" })
    )

    expect(failure.userMessage).toMatch(/include my timetable data/i)
  })

  it("shows the server's reason for a rejected message", () => {
    const failure = describeFeedbackFailure(
      response(400, "Bad Request"),
      JSON.stringify({ error: "Feedback is too long" })
    )

    expect(failure.userMessage).toBe("Feedback is too long")
  })

  it("ignores an HTML error page from a proxy", () => {
    const failure = describeFeedbackFailure(
      response(502, "Bad Gateway"),
      "<html><body>Cloudflare</body></html>"
    )

    expect(failure.message).toBe("Feedback request failed (502 Bad Gateway)")
  })

  it("keeps a plain-text body when the response is not JSON", () => {
    const failure = describeFeedbackFailure(response(500), "upstream timed out")

    expect(failure.message).toContain("upstream timed out")
  })

  it("carries the detail and the visitor's copy on the error", () => {
    const error = new FeedbackSubmitError(
      describeFeedbackFailure(
        response(500),
        JSON.stringify({ error: "Failed to send feedback" })
      )
    )

    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe("FeedbackSubmitError")
    expect(error.message).toContain("Failed to send feedback")
    expect(error.userMessage).toBe(FEEDBACK_SEND_FAILED_MESSAGE)
  })
})
