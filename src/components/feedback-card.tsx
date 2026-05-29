"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import posthog from "posthog-js"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

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
import { Textarea } from "@/components/ui/textarea"

const FormSchema = z.object({
  email: z.optional(z.string()),
  feedback: z
    .string()
    .min(10, { message: "Feedback must be at least 10 characters long." })
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
      feedback: ""
    }
  })

  const onSubmit = (data: z.infer<typeof FormSchema>) => {
    setLoading(true)

    const body = {
      author: data.email ?? "anon",
      feedback: data.feedback,
      category: "feedback"
    }

    const updateDb = async () => {
      fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      })
    }

    posthog.capture("feedback_submitted", {
      has_email: !!data.email,
      feedback_length: data.feedback.length
    })

    toast.promise(updateDb, {
      loading: "Submitting feedback...",
      success: "Feedback submitted!",
      error: "Error submitting feedback. Please try again later"
    })

    form.reset()

    setLoading(false)
  }

  return (
    <div className={cn("rounded-md border p-3 shadow", divClassName)}>
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
                    className="placeholder:text-sm"
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
                    className="h-[200px] placeholder:text-sm lg:h-[100px]"
                  />
                </FormControl>

                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button
              type="submit"
              className="self w-full lg:w-[200px]"
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
