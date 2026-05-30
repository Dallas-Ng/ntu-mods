import type { Metadata } from "next"

import { siteConfig } from "@/config/site"
import Container from "@/components/container"
import FeedbackCard from "@/components/feedback-card"
import Header from "@/components/header"

export const metadata: Metadata = {
  title: siteConfig.metatags.feedback.title,
  description: siteConfig.metatags.feedback.desc,
  alternates: { canonical: "/feedback" }
}

export default function FeedbackPage() {
  return (
    <Container size="sm" className="space-y-8">
      <Header
        title="Feedback"
        subtitle="Share your thoughts, report issues, or suggest improvements."
      />

      <div className="text-muted-foreground space-y-2 text-sm leading-relaxed">
        <p>
          NTUMods is built and maintained by a single person. There is no team —
          just one developer juggling updates, data refreshes, and new features
          alongside everything else.
        </p>
        <p>
          If something is broken, confusing, or could be better, I genuinely
          want to hear about it. Feedback and improvement ideas go a long way in
          keeping this project alive and useful.
        </p>
      </div>

      <FeedbackCard />
    </Container>
  )
}
