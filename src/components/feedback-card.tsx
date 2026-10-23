"use client"

import { useEffect, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { siteConfig } from "@/config/site"
import { reportError, track, whenAnalyticsReady } from "@/lib/analytics"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { TextLink } from "@/components/ui/text-link"
import { Textarea } from "@/components/ui/textarea"

const FormSchema = z.object({
  email: z.optional(z.string()),
  feedback: z
    .string()
    .min(10, { message: "Feedback must be at least 10 characters long." }),
  includeLocalData: z.boolean()
})

interface Props {
  divClassName?: string
  /** Text to start the message with; a new value replaces what is typed. */
  starter?: { text: string; id: number }
}

const FeedbackCard = ({ divClassName, starter }: Props) => {
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
      feedback: "",
      includeLocalData: true
    }
  })

  useEffect(() => {
    if (!starter) return
    form.setValue("feedback", starter.text, { shouldValidate: false })
    form.setFocus("feedback")
  }, [starter, form])

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setLoading(true)

    const localData = data.includeLocalData
      ? Object.fromEntries(
          Object.keys(localStorage).map((key) => [
            key,
            localStorage.getItem(key)
          ])
        )
      : undefined

    const body = {
      author: data.email ?? "anon",
      feedback: data.feedback,
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
      has_email: !!data.email,
      feedback_length: data.feedback.length,
      included_local_data: data.includeLocalData
    })

    try {
      await toast
        .promise(submitFeedback(), {
          loading: "Submitting feedback...",
          success: "Feedback submitted!",
          error: "Error submitting feedback. Please try again later"
        })
        .unwrap()

      form.reset()
    } catch (e) {
      // Toast already surfaced it; keep the input so it isn't retyped.
      reportError("feedback_submit", e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("bg-muted rounded-2xl border p-5", divClassName)}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email (optional)</FormLabel>
                <FormControl>
                  <Input
                    autoComplete="off"
                    placeholder="your@email.com"
                    className="bg-background"
                    {...field}
                  />
                </FormControl>

                <FormDescription>
                  I&apos;ll use this to follow up with you.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="feedback"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Feedback</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Share your thoughts, report an issue, or suggest an improvement..."
                    {...field}
                    className="bg-background min-h-[160px]"
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="includeLocalData"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <FormLabel>Include my timetable data</FormLabel>
                  <FormDescription className="text-pretty">
                    Attaches your saved timetables and settings to help debug
                    the issue. On by default, turn off to exclude it.
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

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
      </Form>
    </div>
  )
}

export default FeedbackCard
