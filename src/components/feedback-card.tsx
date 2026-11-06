"use client"

import { useEffect, useId, useRef, useState, type FormEvent } from "react"
import { toast } from "sonner"

import { siteConfig } from "@/config/site"
import { reportError, track, whenAnalyticsReady } from "@/lib/analytics"
import { validateFeedback } from "@/lib/feedback"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { TextLink } from "@/components/ui/text-link"
import { Textarea } from "@/components/ui/textarea"

interface Props {
  divClassName?: string
  /** Text to start the message with; a new value replaces what is typed. */
  starter?: { text: string; id: number }
}

const FeedbackCard = ({ divClassName, starter }: Props) => {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [feedback, setFeedback] = useState("")
  const [includeLocalData, setIncludeLocalData] = useState(true)
  const [feedbackError, setFeedbackError] = useState<string>()

  // Stable ids so every label, description and error message is wired to its
  // control (the same ids the Form primitives used to generate).
  const emailId = useId()
  const feedbackId = useId()
  const feedbackMessageId = `${feedbackId}-message`
  const localDataId = useId()
  const localDataDescriptionId = `${localDataId}-description`

  const feedbackRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (!starter) return
    setFeedback(starter.text)
    setFeedbackError(undefined)
    feedbackRef.current?.focus()
  }, [starter])

  const onFeedbackChange = (value: string) => {
    setFeedback(value)
    // Once an error is showing, re-check on every keystroke so it clears as
    // soon as the message is long enough.
    if (feedbackError)
      setFeedbackError(
        validateFeedback({ email, feedback: value, includeLocalData }).errors
          .feedback
      )
  }

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const { values, errors } = validateFeedback({
      email,
      feedback,
      includeLocalData
    })

    if (errors.feedback) {
      setFeedbackError(errors.feedback)
      return
    }

    setFeedbackError(undefined)
    setLoading(true)

    const localData = values.includeLocalData
      ? Object.fromEntries(
          Object.keys(localStorage).map((key) => [
            key,
            localStorage.getItem(key)
          ])
        )
      : undefined

    const body = {
      author: values.email || "anon",
      feedback: values.feedback,
      category: "feedback",
      url: window.location.href,
      localData: localData ? JSON.stringify(localData) : undefined
    }

    // fetch only rejects on network failure, a 500 (bad Resend key, say)
    // still resolves, so the status has to be checked explicitly or
    // toast.promise reports success for a submission that never sent.
    //
    // PostHog loads after the page does, so wait briefly for its ID: without
    // it the email and the server-side event can't be tied to this visitor.
    const submitFeedback = async () => {
      const distinctId = (await whenAnalyticsReady(2000))?.get_distinct_id()
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ ...body, distinctId })
      })

      if (!res.ok) throw new Error(`Feedback request failed (${res.status})`)
    }

    track("feedback_submitted", {
      has_email: !!values.email,
      feedback_length: values.feedback.length,
      included_local_data: values.includeLocalData
    })

    try {
      await toast
        .promise(submitFeedback(), {
          loading: "Submitting feedback...",
          success: "Feedback submitted!",
          error: "Error submitting feedback. Please try again later"
        })
        .unwrap()

      setEmail("")
      setFeedback("")
      setIncludeLocalData(true)
    } catch (e) {
      // Toast already surfaced it; keep the input so it isn't retyped.
      reportError("feedback_submit", e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("bg-muted rounded-2xl p-5", divClassName)}>
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor={emailId}>Email (optional)</Label>
          <Input
            id={emailId}
            autoComplete="off"
            placeholder="your@email.com"
            className="bg-background"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <p className="text-muted-foreground text-sm">
            I&apos;ll use this to follow up with you.
          </p>
        </div>

        <div className="grid gap-2">
          <Label
            htmlFor={feedbackId}
            data-error={!!feedbackError}
            className="data-[error=true]:text-destructive">
            Feedback
          </Label>
          <Textarea
            id={feedbackId}
            ref={feedbackRef}
            placeholder="Share your thoughts, report an issue, or suggest an improvement..."
            className="bg-background min-h-[160px]"
            aria-invalid={!!feedbackError}
            aria-describedby={feedbackError ? feedbackMessageId : undefined}
            value={feedback}
            onChange={(e) => onFeedbackChange(e.target.value)}
          />
          {feedbackError ? (
            <p id={feedbackMessageId} className="text-destructive text-sm">
              {feedbackError}
            </p>
          ) : null}
        </div>

        <div className="flex flex-row items-center justify-between gap-4">
          <div className="space-y-0.5">
            <Label htmlFor={localDataId}>Include my timetable data</Label>
            <p
              id={localDataDescriptionId}
              className="text-muted-foreground text-sm text-pretty">
              Attaches your saved timetables and settings to help debug the
              issue. On by default, turn off to exclude it.
            </p>
          </div>
          <Switch
            id={localDataId}
            aria-describedby={localDataDescriptionId}
            checked={includeLocalData}
            onCheckedChange={setIncludeLocalData}
          />
        </div>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-muted-foreground shrink-0 text-xs whitespace-nowrap">
            Developer?{" "}
            <TextLink
              href={`${siteConfig.links.repo}/issues`}
              target="_blank"
              rel="noopener noreferrer">
              Open an issue or PR
            </TextLink>
            .
          </p>
          <Button
            type="submit"
            className="w-full sm:w-auto sm:max-w-[200px] sm:flex-1"
            disabled={loading}>
            Submit
          </Button>
        </div>
      </form>
    </div>
  )
}

export default FeedbackCard
