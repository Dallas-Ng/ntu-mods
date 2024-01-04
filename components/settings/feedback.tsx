"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import * as z from "zod"

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

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "../ui/card"
import { Textarea } from "../ui/textarea"

const FormSchema = z.object({
  email: z.string().email({
    message:
      "Please enter a valid email address. We will not be able to contact you with an invalid email."
  }),
  feedback: z
    .string()
    .min(10, { message: "Feedback must be at least 10 characters long." })
})

export default function Feedback() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
      feedback: ""
    }
  })

  function onSubmit(data: z.infer<typeof FormSchema>) {
    console.log(data)
    toast.success("Feedback submitted!")
  }

  return (
    <Card className="p-4">
      <CardHeader className="p-0">
        <CardTitle className="text-lg">
          Report Issues or Give Feedback
        </CardTitle>

        <CardDescription>
          Let us know of any problems or give us suggestions to improve our
          system!
        </CardDescription>
      </CardHeader>

      <CardContent className="mt-5 p-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="off"
                      placeholder="my@email.com"
                      {...field}
                    />
                  </FormControl>

                  <FormDescription>
                    We will use this to contact you.
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
                      placeholder="Feedback..."
                      {...field}
                      className="h-[200px]"
                    />
                  </FormControl>

                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-[200px]">
              Submit
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
