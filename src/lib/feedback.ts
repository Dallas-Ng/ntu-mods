import * as z from "zod"

// The client half of the rules in `astro/pages/api/feedback.ts`: a message is
// trimmed and must not be blank, and 10 characters is the shortest note that is
// usually worth reading. Checking here means a too-short one is caught inline
// instead of failing the request after it has been sent.
export const MIN_FEEDBACK_LENGTH = 10

export const FeedbackFormSchema = z.object({
  email: z.optional(z.string()),
  // trim() runs before min(), so whitespace alone never counts towards the
  // length and the value submitted is the trimmed one.
  feedback: z
    .string()
    .trim()
    .min(MIN_FEEDBACK_LENGTH, {
      message: `Feedback must be at least ${MIN_FEEDBACK_LENGTH} characters long.`
    }),
  includeLocalData: z.boolean()
})

export type FeedbackForm = z.infer<typeof FeedbackFormSchema>
