import { LATEST_SEMESTER_LABEL } from "@/lib/semesters"
import type { ArticleHeading } from "@/lib/server/articles"
import { Button } from "@/components/ui/button"

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
      "NTU Mods is a timetable planner and module browser for Nanyang Technological University (NTU) students. It lets you browse modules, compare indexes, and plan your schedule, without needing to log into STARS."
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
        <a
          href="#feedback"
          className="text-primary font-semibold underline underline-offset-4 hover:no-underline">
          feedback form below
        </a>
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
        <a
          href="/timetable"
          className="text-primary font-semibold underline underline-offset-4 hover:no-underline">
          timetable
        </a>{" "}
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
      "An index is a specific class group for a module, it has a fixed set of timeslots and venues for lectures, tutorials, and labs. Different indexes cover the same course content but meet at different times. You pick one index per module when registering in STARS."
  },
  {
    id: "browse-modules",
    question: "How do I browse modules?",
    answer: (
      <>
        Use the{" "}
        <a
          href="/mods"
          className="text-primary font-semibold underline underline-offset-4 hover:no-underline">
          mods
        </a>{" "}
        page to search and filter all NTU modules. Click on any module to see
        its full details, description, academic units, prerequisites, exam
        schedule, and all available indexes with their timeslots and venues.
      </>
    ),
    answerText:
      "Use the mods page at /mods to search and filter all NTU modules. Click on any module to see its full details, description, academic units, prerequisites, exam schedule, and all available indexes with their timeslots and venues."
  },
  {
    id: "export-timetable",
    question: "How do I export my timetable?",
    answer:
      "There are two export options on the timetable page. You can download an .ics calendar file to import directly into Google Calendar, Apple Calendar, or Outlook. You can also save your timetable as an image, useful for sharing or setting as a wallpaper."
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
      "Your timetable is saved in your browser's localStorage, it stays between visits on the same device and browser, but clears if you wipe your browser data, close an incognito window, or switch to a different device or browser. There is no account system, so nothing is synced to the cloud."
  },
  {
    id: "live-vacancies",
    question: "Can you show live vacancies for indexes?",
    answer:
      "No. Vacancy data is not publicly available from NTU's systems. Use NTU Mods to figure out which indexes fit your schedule, then check STARS for real-time availability when registration opens."
  },
  {
    id: "data-tracking",
    question: "Do you track my data?",
    answer: (
      <>
        We use analytics tools (Google Analytics, Microsoft Clarity, and
        PostHog) to collect page views, usage patterns, and session replays. No
        personal data is collected. Everything you add to your timetable is
        stored only in your browser and never sent to our servers. See the{" "}
        <a
          href="/privacy"
          className="text-primary font-semibold underline underline-offset-4 hover:no-underline">
          Privacy Policy
        </a>{" "}
        for full details. The CGPA and FGO tools read your transcript PDF in
        your browser and never upload the file. By default, module codes, terms
        and grades (never your name or matric number) are also sent for
        analytics. Untick the share box before uploading to opt out.
      </>
    ),
    answerText:
      "We use analytics tools (Google Analytics, Microsoft Clarity, and PostHog) to collect page views, usage patterns, and session replays. No personal data is collected. Everything you add to your timetable is stored only in your browser and never sent to our servers. The CGPA and FGO tools read your transcript PDF in your browser and never upload the file. By default, module codes, terms and grades (never your name or matric number) are also sent for analytics. Untick the share box before uploading to opt out."
  }
]

export const faqHeadings: ArticleHeading[] = FAQ_CONFIG.map(
  ({ id, question }) => ({
    id,
    depth: 2,
    text: question
  })
)

/** Question/answer pairs for the FAQPage JSON-LD built in the faq page. */
export const faqItems = FAQ_CONFIG.map(({ question, answer, answerText }) => ({
  question,
  answer: answerText ?? (answer as string)
}))

interface Props {
  /** Rendered as the second grid column ; the .astro page passes its own
   * ArticleToc island here so this component can stay a zero-JS static
   * render (it has no interactivity of its own). */
  children?: React.ReactNode
}

const FaqContent = ({ children }: Props) => {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-8 pb-12 md:pt-10 md:pb-20">
      <div className="mb-10 max-w-3xl md:mb-14">
        <h1 className="text-3xl leading-[1.05] font-bold tracking-tighter md:text-5xl">
          Frequently asked questions
        </h1>
        <p className="mt-4 max-w-xl text-base md:text-lg">
          Answers for planning timetables, browsing modules, exporting
          schedules, and understanding how your data is stored.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-12 [&>*]:min-w-0">
        <div className="space-y-3">
          {FAQ_CONFIG.map(({ id, question, answer }) => (
            <section
              id={id}
              key={id}
              className="bg-muted scroll-mt-20 rounded-2xl p-5 md:p-6">
              <h2 className="text-2xl leading-tight font-bold tracking-tight">
                {question}
              </h2>

              <p className="text-foreground/80 mt-3 max-w-3xl text-base md:text-lg">
                {answer}
              </p>
            </section>
          ))}

          <div
            id="feedback"
            className="bg-muted flex scroll-mt-20 flex-col justify-between gap-6 rounded-2xl p-5 md:flex-row md:items-center md:p-6">
            <div>
              <h2 className="text-2xl leading-tight font-bold tracking-tight">
                Still have a question?
              </h2>
              <p className="text-foreground/80 mt-3 text-base md:text-lg">
                Have a problem or suggestion? Let us know.
              </p>
            </div>

            <Button
              size="lg"
              className="h-12 px-6 text-base active:scale-[0.98] md:px-8"
              asChild>
              <a href="/feedback">Share feedback</a>
            </Button>
          </div>
        </div>

        {children}
      </div>
    </div>
  )
}

export default FaqContent
