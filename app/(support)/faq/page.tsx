import type { Metadata } from "next"
import Link from "next/link"

import { siteConfig } from "@/config/site"
import { LATEST_SEMESTER_LABEL } from "@/lib/semesters"
import type { ArticleHeading } from "@/lib/server/articles"
import { Button } from "@/components/ui/button"
import ArticleToc from "@/components/articles/article-toc"
import Container from "@/components/container"
import Header from "@/components/header"

export const metadata: Metadata = {
  title: siteConfig.metatags.faq.title,
  description: siteConfig.metatags.faq.desc,
  alternates: { canonical: "/faq" }
}

interface FaqConfig {
  id: string
  question: string
  answer: React.ReactNode
  answerText?: string
}

const FAQ_CONFIG: FaqConfig[] = [
  {
    id: "what-is-ntu-mods",
    question: "What is NTU Mods?",
    answer:
      "NTU Mods is a timetable planner and module browser for Nanyang Technological University (NTU) students. It lets you browse modules, compare indexes, and plan your schedule — without needing to log into STARS."
  },
  {
    id: "ntu-affiliation",
    question: "Is NTU Mods affiliated with NTU?",
    answer:
      "No. NTU Mods is an independent project and is not affiliated with, endorsed by, or connected to Nanyang Technological University. Module and timetable data is sourced from NTU's publicly accessible systems."
  },
  {
    id: "current-semester",
    question: "What semester is currently available?",
    answer: (
      <>
        The latest semester available is{" "}
        <strong>{LATEST_SEMESTER_LABEL}</strong>. If this is outdated and you
        need data for a newer semester, feel free to request it via the{" "}
        <Link
          href="#feedback"
          className="text-blue-500 transition-colors hover:text-blue-600">
          feedback form below
        </Link>
        .
      </>
    ),
    answerText: `The latest semester available is ${LATEST_SEMESTER_LABEL}. If this is outdated and you need data for a newer semester, feel free to request it via the feedback form.`
  },
  {
    id: "plan-timetable",
    question: "How do I plan my timetable?",
    answer: (
      <>
        Head to the{" "}
        <Link
          href="/timetable"
          className="text-blue-500 transition-colors hover:text-blue-600">
          timetable
        </Link>{" "}
        page and search for a module by code or title. Select it, then choose an
        index that fits your schedule. The app automatically detects conflicts
        with your existing classes and highlights them.
      </>
    ),
    answerText:
      "Head to the timetable page at /timetable and search for a module by code or title. Select it, then choose an index that fits your schedule. The app automatically detects conflicts with your existing classes and highlights them."
  },
  {
    id: "what-is-an-index",
    question: "What is an index?",
    answer:
      "An index is a specific class group for a module — it has a fixed set of timeslots and venues for lectures, tutorials, and labs. Different indexes cover the same course content but meet at different times. You pick one index per module when registering in STARS."
  },
  {
    id: "browse-modules",
    question: "How do I browse modules?",
    answer: (
      <>
        Use the{" "}
        <Link
          href="/mods"
          className="text-blue-500 transition-colors hover:text-blue-600">
          mods
        </Link>{" "}
        page to search and filter all NTU modules. Click on any module to see
        its full details — description, academic units, prerequisites, exam
        schedule, and all available indexes with their timeslots and venues.
      </>
    ),
    answerText:
      "Use the mods page at /mods to search and filter all NTU modules. Click on any module to see its full details — description, academic units, prerequisites, exam schedule, and all available indexes with their timeslots and venues."
  },
  {
    id: "export-timetable",
    question: "How do I export my timetable?",
    answer:
      "There are two export options on the timetable page. You can download an .ics calendar file to import directly into Google Calendar, Apple Calendar, or Outlook. You can also save your timetable as an image — useful for sharing or setting as a wallpaper."
  },
  {
    id: "share-timetable",
    question: "How do I share my timetable?",
    answer:
      "Use the share button on the timetable page to generate a shareable URL. Anyone with the link can view your timetable, and they can copy it to their own planner to modify it."
  },
  {
    id: "timetable-disappeared",
    question: "Why did my timetable disappear?",
    answer:
      "Your timetable is saved in your browser's localStorage — it stays between visits on the same device and browser, but clears if you wipe your browser data, close an incognito window, or switch to a different device or browser. There is no account system, so nothing is synced to the cloud."
  },
  {
    id: "live-vacancies",
    question: "Can you show live vacancies for indexes?",
    answer:
      "No — vacancy data is not publicly available from NTU's systems. Use NTU Mods to figure out which indexes fit your schedule, then check STARS for real-time availability when registration opens."
  },
  {
    id: "data-tracking",
    question: "Do you track my data?",
    answer: (
      <>
        We use analytics tools — Google Analytics, Microsoft Clarity, and
        PostHog — to collect page views, usage patterns, and session replays. No
        personal data is collected. Everything you add to your timetable is
        stored only in your browser and never sent to our servers. See the{" "}
        <Link
          href="/privacy"
          className="text-blue-500 transition-colors hover:text-blue-600">
          Privacy Policy
        </Link>{" "}
        for full details.
      </>
    ),
    answerText:
      "We use analytics tools — Google Analytics, Microsoft Clarity, and PostHog — to collect page views, usage patterns, and session replays. No personal data is collected. Everything you add to your timetable is stored only in your browser and never sent to our servers."
  }
]

const faqHeadings: ArticleHeading[] = FAQ_CONFIG.map(({ id, question }) => ({
  id,
  depth: 2,
  text: question
}))

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_CONFIG.map(({ question, answer, answerText }) => ({
    "@type": "Question",
    name: question,
    acceptedAnswer: {
      "@type": "Answer",
      text: answerText ?? (answer as string)
    }
  }))
}

export default function FaqPage() {
  return (
    <Container size="md">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,48rem)_16rem]">
        <div className="space-y-8">
          <Header
            title="Frequently Asked Questions"
            subtitle="Answers for planning timetables, browsing modules, exporting schedules, and understanding how your data is stored."
          />

          <div className="space-y-6">
            {FAQ_CONFIG.map(({ id, question, answer }) => (
              <section
                id={id}
                key={id}
                className="border-border scroll-mt-20 space-y-3 border-t pt-6 first:border-t-0 first:pt-0">
                <h2 className="text-xl font-semibold">{question}</h2>

                <p className="text-muted-foreground">{answer}</p>
              </section>
            ))}
          </div>

          <hr />

          <div id="feedback" className="space-y-3">
            <div>
              <h2 className="text-xl font-semibold">Feedback</h2>

              <p className="text-muted-foreground text-sm">
                Have a problem or suggestion? Let us know.
              </p>
            </div>

            <Link href="/feedback">
              <Button variant="outline">Share Feedback</Button>
            </Link>
          </div>
        </div>

        <ArticleToc headings={faqHeadings} />
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </Container>
  )
}
