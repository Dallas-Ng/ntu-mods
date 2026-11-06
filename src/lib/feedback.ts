/**
 * The client half of the rules in `astro/pages/api/feedback.ts`: a message is
 * trimmed and must not be blank, and 10 characters is the shortest note that is
 * usually worth reading. Checking here means a too-short one is caught inline
 * instead of failing the request after it has been sent.
 *
 * Plain functions: this is the only form in the app, and two rules did not
 * justify a schema library in the client bundle.
 */
export const MIN_FEEDBACK_LENGTH = 10

export const FEEDBACK_TOO_SHORT_MESSAGE = `Feedback must be at least ${MIN_FEEDBACK_LENGTH} characters long.`

export interface FeedbackForm {
  email: string
  feedback: string
  includeLocalData: boolean
}

export interface FeedbackFormErrors {
  feedback?: string
}

/**
 * Trim, then check. `values` is what should be submitted: trimming before
 * counting means whitespace alone never reaches the minimum.
 */
export const validateFeedback = (
  form: FeedbackForm
): { values: FeedbackForm; errors: FeedbackFormErrors } => {
  const values = { ...form, feedback: form.feedback.trim() }

  if (values.feedback.length < MIN_FEEDBACK_LENGTH)
    return { values, errors: { feedback: FEEDBACK_TOO_SHORT_MESSAGE } }

  return { values, errors: {} }
}
