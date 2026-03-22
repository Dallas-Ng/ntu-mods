import Link from "next/link"
import { ServerCrash } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import FeedbackCard from "@/components/feedback-card"

interface HelpConfig {
  question: React.ReactNode
  answer: React.ReactNode
}

const HELP_CONFIG: HelpConfig[] = [
  {
    question: "What is NTU Mods?",
    answer:
      "NTU Mods is a timetable planner and module browser for Nanyang Technological University (NTU) students. It lets you browse modules, compare indexes, and plan your schedule — without needing to log into STARS."
  },
  {
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
    question: "What is an index?",
    answer:
      "An index is a specific class group for a module — it has a fixed set of timeslots and venues for lectures, tutorials, and labs. Different indexes cover the same course content but meet at different times. You pick one index per module when registering in STARS."
  },
  {
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
    question: "How do I export my timetable?",
    answer:
      "There are two export options on the timetable page. You can download an .ics calendar file to import directly into Google Calendar, Apple Calendar, or Outlook. You can also save your timetable as an image — useful for sharing or setting as a wallpaper."
  },
  {
    question: "How do I share my timetable?",
    answer:
      "Use the share button on the timetable page to generate a shareable URL. Anyone with the link can view your timetable, and they can copy it to their own planner to modify it."
  },
  {
    question: "Can you show live vacancies for indexes?",
    answer:
      "No — vacancy data is not publicly available from NTU's systems. Use NTU Mods to figure out which indexes fit your schedule, then check STARS for real-time availability when registration opens."
  },
  {
    question: "Do you track my data?",
    answer:
      "We track general usage analytics (page views, number of visitors) via Vercel. We do not collect any personal data. Everything you add to your timetable is stored only in your browser and never sent to our servers."
  },
  {
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
    <div className="mx-auto max-w-2xl space-y-10 lg:mt-5">
      {/* <div className="space-y-5">
        <Header
          title="Frequently Asked Questions"
          subtitle={
            <span className="w-full text-muted-foreground">
              Can&apos;t find the answer you&apos;re looking for?{" "}
              <a
                href="mailto:ngdallas1@gmail.com"
                className="inline-flex text-primary hover:underline">
                <span className="flex items-center gap-1">
                  Reach out to me <Mail className="size-5" />
                </span>
              </a>
            </span>
          }
        />
      </div> */}

      <div className="space-y-3">
        <p>Quick Access</p>

        <ul id="faq-0" className="list-inside list-disc">
          {HELP_CONFIG.map(({ question }, i) => (
            <li key={i}>
              <Link
                href={`#faq-${i}`}
                className="text-blue-500 transition-colors hover:text-blue-600">
                {question}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-5">
        {HELP_CONFIG.map(({ question, answer }, i) => (
          <>
            <div id={`faq-${i}`} key={i} className="space-y-3 pt-[65px]">
              <h2 className="text-xl font-bold">{question}</h2>

              <p className="mt-2 text-muted-foreground">{answer}</p>
            </div>

            {i === HELP_CONFIG.length - 1 && (
              <div>
                <Link href="/debug">
                  <Alert className="border-2 transition-colors hover:bg-muted">
                    <ServerCrash className="size-5" />

                    <AlertTitle>Having Problems with the System?</AlertTitle>

                    <AlertDescription>
                      Click here if you need to reset the application
                    </AlertDescription>
                  </Alert>
                </Link>
              </div>
            )}
          </>
        ))}
      </div>

      <div className="space-y-3">
        <h3>Give us your feedback!</h3>

        <FeedbackCard divClassName="border-2" />
      </div>
    </div>
  )
}
