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

export const FEEDBACK_SEND_FAILED_MESSAGE =
  "Error submitting feedback. Please try again later."

export interface FeedbackFailure {
  /** For error reporting: the status and whatever the server explained. */
  message: string
  /** For the visitor: what they can do about it. */
  userMessage: string
}

/** The `error` field of a JSON body, if the body is JSON and has one. */
const readServerError = (body: string) => {
  try {
    const parsed = JSON.parse(body) as { error?: unknown }
    if (typeof parsed?.error === "string" && parsed.error) return parsed.error
  } catch {
    // Not JSON: a proxy or Cloudflare error page, not our API.
  }
  const text = body.trim()
  return text && !text.startsWith("<") ? text.slice(0, 200) : ""
}

/** What the visitor should do about a failure, in their own words. */
const userMessageFor = (status: number, detail: string) => {
  if (status === 429)
    return "Too many messages in a row. Wait a minute and try again."
  if (status === 413)
    return 'That is too much to send. Turn off "Include my timetable data" and try again.'
  // 400 means the message itself was rejected, which is the visitor's to fix.
  if (status === 400 && detail) return detail
  return FEEDBACK_SEND_FAILED_MESSAGE
}

/**
 * Explain a failed `/api/feedback` response. The route returns
 * `{ error }` with a reason, so keep it in the reported message instead of
 * losing it: "500" alone says nothing about which key or limit failed.
 */
export const describeFeedbackFailure = (
  res: { status: number; statusText?: string },
  body: string
): FeedbackFailure => {
  const status = res.statusText
    ? `${res.status} ${res.statusText}`
    : `${res.status}`
  const detail = readServerError(body)

  return {
    message: detail
      ? `Feedback request failed (${status}): ${detail}`
      : `Feedback request failed (${status})`,
    userMessage: userMessageFor(res.status, detail)
  }
}

/** A failed submission that carries both the detail and the visitor's copy. */
export class FeedbackSubmitError extends Error {
  readonly userMessage: string

  constructor(failure: FeedbackFailure) {
    super(failure.message)
    this.name = "FeedbackSubmitError"
    this.userMessage = failure.userMessage
  }
}

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
