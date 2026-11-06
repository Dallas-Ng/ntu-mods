import { describe, expect, it } from "vitest"

import {
  FEEDBACK_TOO_SHORT_MESSAGE,
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
