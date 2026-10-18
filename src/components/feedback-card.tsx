"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

import { getDistinctId, track } from "@/lib/analytics"
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
}

const FeedbackCard = ({ divClassName }: Props) => {
  const [loading, setLoading] = useState(false)

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
      feedback: "",
      includeLocalData: true
    }
  })

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
      distinctId: getDistinctId(),
      url: window.location.href,
      localData: localData ? JSON.stringify(localData) : undefined
    }

    // fetch only rejects on network failure, a 500 (bad Resend key, say)
    // still resolves, so the status has to be checked explicitly or
    // toast.promise reports success for a submission that never sent.
    const submitFeedback = async () => {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
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
    } catch {
      // Toast already surfaced it; keep the input so it isn't retyped.
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("bg-muted rounded-2xl p-5", divClassName)}>
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
                    className="bg-background placeholder:text-sm"
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
                    className="bg-background min-h-[160px] placeholder:text-sm"
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
                  <FormDescription>
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

          <div className="flex justify-end">
            <Button
              type="submit"
              className="w-full lg:w-[200px]"
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
