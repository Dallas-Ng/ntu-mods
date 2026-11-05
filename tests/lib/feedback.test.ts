import { zodResolver } from "@hookform/resolvers/zod"
import { describe, expect, it } from "vitest"

import { FeedbackFormSchema, MIN_FEEDBACK_LENGTH } from "@/lib/feedback"

// The resolver is what a form submit runs. It must resolve with field errors for
// invalid input: throwing a ZodError instead is what became PostHog issue #353
// ("ZodError" with no useful stack), when @hookform/resolvers 3 met zod 4.
const resolve = (feedback: string) =>
  zodResolver(FeedbackFormSchema)(
    { email: "", feedback, includeLocalData: true },
    undefined,
    {
      criteriaMode: "firstError",
      fields: {},
      shouldUseNativeValidation: false,
      names: []
    }
  )

describe("feedback form", () => {
  it("returns a field error for a message that is too short", async () => {
    const result = await resolve("too short")

    expect(result.errors).toEqual({
      feedback: {
        type: "too_small",
        message: `Feedback must be at least ${MIN_FEEDBACK_LENGTH} characters long.`
      }
    })
  })

  it("does not count whitespace towards the minimum", async () => {
    const result = await resolve(" ".repeat(MIN_FEEDBACK_LENGTH))

    expect(result.errors.feedback?.type).toBe("too_small")
  })

  it("accepts a real message and trims it", async () => {
    const result = await resolve("  the timetable export is great  ")

    expect(result.errors).toEqual({})
    expect(result.values.feedback).toBe("the timetable export is great")
  })
})
