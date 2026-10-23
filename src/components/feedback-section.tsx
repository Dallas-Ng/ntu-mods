"use client"

import { useState } from "react"
import { ArrowDown, ArrowRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { cardVariants, controlOnCard } from "@/components/ui/card"
import FeedbackCard from "@/components/feedback-card"

// Each row starts the message for you, so there is less to write.
const STARTERS = [
  {
    label: "A module, index, venue or exam date looks wrong",
    lead: "Wrong data"
  },
  { label: "I have an idea", lead: "Idea" },
  { label: "Something is confusing", lead: "Confusing" }
] as const

/**
 * Bottom of every page: words on the left, the form on the right, as one
 * flat panel centred in a fixed width, so it lines up on narrow pages
 * (articles, links) as well as full-width ones. The form already sends the
 * page URL with each submission.
 */
const FeedbackSection = () => {
  const [starter, setStarter] = useState<{ text: string; id: number }>()

  return (
    <section
      data-nosnippet
      aria-labelledby="feedback-heading"
      className="mt-20 mb-4 px-4 lg:px-5">
      <div
        className={cn(
          cardVariants(),
          "mx-auto grid max-w-5xl gap-10 rounded-3xl p-6 sm:p-10 lg:grid-cols-2 lg:items-center lg:gap-16 lg:p-14"
        )}>
        <div className="space-y-8">
          <div className="space-y-5">
            <h2
              id="feedback-heading"
              className="text-3xl leading-tight font-bold tracking-tighter text-balance md:text-4xl">
              Found something wrong?
            </h2>
            <p className="max-w-md text-base leading-relaxed text-pretty md:text-lg">
              NTUMods is built and maintained by one person, so a short note
              goes a long way. Pick what fits, add the details, and I will look
              at it.
            </p>
          </div>

          <ul className="space-y-2.5">
            {STARTERS.map(({ label, lead }) => (
              <li key={lead}>
                <button
                  type="button"
                  onClick={() =>
                    setStarter({
                      text: `${lead} on ${window.location.pathname}: `,
                      id: Date.now()
                    })
                  }
                  className={cn(
                    controlOnCard,
                    "flex w-full cursor-pointer items-center justify-between gap-4 rounded-2xl px-4 py-3 text-left text-sm font-medium transition-[color,box-shadow,transform] duration-150 active:scale-[0.99]"
                  )}>
                  {label}
                  <ArrowDown className="text-muted-foreground size-4 shrink-0 lg:hidden" />
                  <ArrowRight className="text-muted-foreground hidden size-4 shrink-0 lg:block" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        <FeedbackCard divClassName="bg-background sm:p-6" starter={starter} />
      </div>
    </section>
  )
}

export default FeedbackSection
