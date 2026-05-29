import type { Metadata } from "next"
import Link from "next/link"
import { History, ServerCrash } from "lucide-react"

import { siteConfig } from "@/config/site"
import { SUPPORT_PAGE_CONTAINER_CLASSNAME } from "@/lib/constants"
import { LATEST_SEMESTER_LABEL } from "@/lib/semesters"
import { cn } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import FeedbackCard from "@/components/feedback-card"
import Header from "@/components/header"

export const metadata: Metadata = {
  title: siteConfig.metatags.faq.title,
  description: siteConfig.metatags.faq.desc,
  alternates: { canonical: "/faq" }
}

interface HelpConfig {
  id: string
  question: React.ReactNode
  answer: React.ReactNode
}

const HELP_CONFIG: HelpConfig[] = [
  {
    id: "what-is-ntu-mods",
    question: "What is NTU Mods?",
    answer:
      "NTU Mods is a timetable planner and module browser for Nanyang Technological University (NTU) students. It lets you browse modules, compare indexes, and plan your schedule — without needing to log into STARS."
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
    )
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
    )
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
    )
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
    id: "live-vacancies",
    question: "Can you show live vacancies for indexes?",
    answer:
      "No — vacancy data is not publicly available from NTU's systems. Use NTU Mods to figure out which indexes fit your schedule, then check STARS for real-time availability when registration opens."
  },
  {
    id: "data-tracking",
    question: "Do you track my data?",
    answer:
      "We track general usage analytics (page views, number of visitors) via Vercel. We do not collect any personal data. Everything you add to your timetable is stored only in your browser and never sent to our servers."
  },
  {
    id: "something-broken",
    question: "Something looks broken!",
    answer: (
      <>
        Try the{" "}
        <Link
          href="/debug"
          className="text-blue-500 transition-colors hover:text-blue-600">
          debug page
        </Link>
        , which lets you inspect and reset your local timetable data. This is
        useful if the app behaves unexpectedly after an update. You can also
        send us feedback below.
      </>
    )
  }
]

export default function HelpPage() {
  return (
    <div className={cn(SUPPORT_PAGE_CONTAINER_CLASSNAME, "space-y-8")}>
      <Header
        title="Help"
        subtitle="Answers for planning timetables, browsing modules, exporting schedules, and fixing local app issues."
      />

      <div className="space-y-3">
        <h2 className="text-xl font-semibold">Quick Access</h2>

        <nav className="grid gap-2 sm:grid-cols-2">
          {HELP_CONFIG.map(({ id, question }) => (
            <Link
              key={id}
              href={`#${id}`}
              className="text-muted-foreground hover:bg-muted hover:text-foreground rounded-md border px-3 py-2 text-sm transition-colors">
              {question}
            </Link>
          ))}
        </nav>
      </div>

      <div className="space-y-6">
        {HELP_CONFIG.map(({ id, question, answer }) => (
          <section
            id={id}
            key={id}
            className="border-border scroll-mt-20 space-y-3 border-t pt-6 first:border-t-0 first:pt-0">
            <h2 className="text-xl font-semibold">{question}</h2>

            <p className="text-muted-foreground">{answer}</p>
          </section>
        ))}
      </div>

      <div className="grid gap-3">
        <Link href="/debug" className="block">
          <Alert className="hover:bg-muted border transition-colors">
            <ServerCrash className="size-5" />

            <AlertTitle>Having Problems with the System?</AlertTitle>

            <AlertDescription>
              Reset local timetable data if the app behaves unexpectedly.
            </AlertDescription>
          </Alert>
        </Link>

        <Link href="/changelog" className="block">
          <Alert className="hover:bg-muted border transition-colors">
            <History className="size-5" />

            <AlertTitle>See what changed recently</AlertTitle>

            <AlertDescription>
              View the latest NTU Mods features, fixes, and data updates.
            </AlertDescription>
          </Alert>
        </Link>
      </div>

      <div id="feedback" className="space-y-3">
        <div>
          <h2 className="text-xl font-semibold">Feedback</h2>

          <p className="text-muted-foreground text-sm">
            Let us know of any problems or suggestions you have.
          </p>
        </div>

        <FeedbackCard divClassName="border" />
      </div>
    </div>
  )
}
