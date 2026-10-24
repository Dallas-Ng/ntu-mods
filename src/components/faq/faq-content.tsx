import { siteConfig } from "@/config/site"
import { LATEST_SEMESTER_LABEL } from "@/lib/semesters"
import type { ArticleHeading } from "@/lib/server/articles"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { cardVariants } from "@/components/ui/card"
import { TextLink } from "@/components/ui/text-link"
import Container from "@/components/container"
import Header, { SectionHeading } from "@/components/header"
import HeadingAnchor from "@/components/heading-anchor"

interface FaqConfig {
  id: string
  group: string
  question: string
  answer: React.ReactNode
  answerText?: string
}

const REPO_URL = siteConfig.links.repo

const FAQ_GROUPS = [
  { id: "about", title: "About NTUMods" },
  { id: "planning", title: "Planning your timetable" },
  { id: "your-data", title: "Your data and privacy" },
  { id: "open-source-and-contributing", title: "Open source and contributing" }
] as const

const FAQ_CONFIG: FaqConfig[] = [
  {
    id: "what-is-ntu-mods",
    group: "about",
    question: "What is NTUMods?",
    answer:
      "NTUMods is a timetable planner and module browser for Nanyang Technological University (NTU) students. It lets you browse modules, compare indexes, and plan your schedule, without needing to log into STARS."
  },
  {
    id: "ntu-affiliation",
    group: "about",
    question: "Is NTUMods affiliated with NTU?",
    answer:
      "No. NTUMods is an independent project and is not affiliated with, endorsed by, or connected to Nanyang Technological University. Module and timetable data is sourced from NTU's publicly accessible systems."
  },
  {
    id: "current-semester",
    group: "about",
    question: "What semester is currently available?",
    answer: (
      <>
        The latest semester available is{" "}
        <strong>{LATEST_SEMESTER_LABEL}</strong>. If this is outdated and you
        need data for a newer semester, feel free to request it via the{" "}
        <TextLink href="#feedback">feedback form below</TextLink>.
      </>
    ),
    answerText: `The latest semester available is ${LATEST_SEMESTER_LABEL}. If this is outdated and you need data for a newer semester, feel free to request it via the feedback form.`
  },
  {
    id: "live-vacancies",
    group: "about",
    question: "Can you show live vacancies for indexes?",
    answer:
      "No. Vacancy data is not publicly available from NTU's systems. Use NTUMods to figure out which indexes fit your schedule, then check STARS for real-time availability when registration opens."
  },
  {
    id: "plan-timetable",
    group: "planning",
    question: "How do I plan my timetable?",
    answer: (
      <>
        Head to the <TextLink href="/timetable">timetable</TextLink> page and
        search for a module by code or title. Select it, then choose an index
        that fits your schedule. The app automatically detects conflicts with
        your existing classes and highlights them.
      </>
    ),
    answerText:
      "Head to the timetable page at /timetable and search for a module by code or title. Select it, then choose an index that fits your schedule. The app automatically detects conflicts with your existing classes and highlights them."
  },
  {
    id: "what-is-an-index",
    group: "planning",
    question: "What is an index?",
    answer:
      "An index is a specific class group for a module. It has a fixed set of timeslots and venues for lectures, tutorials, and labs. Different indexes cover the same course content but meet at different times. You pick one index per module when registering in STARS."
  },
  {
    id: "browse-modules",
    group: "planning",
    question: "How do I browse modules?",
    answer: (
      <>
        Use the <TextLink href="/mods">mods</TextLink> page to search and filter
        all NTU modules. Click on any module to see its full details:
        description, academic units, prerequisites, exam schedule, and all
        available indexes with their timeslots and venues.
      </>
    ),
    answerText:
      "Use the mods page at /mods to search and filter all NTU modules. Click on any module to see its full details: description, academic units, prerequisites, exam schedule, and all available indexes with their timeslots and venues."
  },
  {
    id: "walking-between-classes",
    group: "planning",
    question: "Can I check if I have enough time to walk between classes?",
    answer:
      "Yes. On the timetable page, open Walking between classes under Generate Timetable and pick a day. It shows your classes in order on the campus map, the walking time between each pair of venues, and a warning when a gap is shorter than the walk or two classes overlap. Times are estimates, so leave extra room for lifts and stairs."
  },
  {
    id: "export-timetable",
    group: "planning",
    question: "How do I export my timetable?",
    answer:
      "There are two export options on the timetable page. You can download an .ics calendar file to import directly into Google Calendar, Apple Calendar, or Outlook. You can also save your timetable as an image, which is useful for sharing or setting as a wallpaper."
  },
  {
    id: "share-timetable",
    group: "planning",
    question: "How do I share my timetable?",
    answer:
      "Use the share button on the timetable page to generate a shareable URL. Anyone with the link can view your timetable, and they can copy it to their own planner to modify it."
  },
  {
    id: "timetable-disappeared",
    group: "your-data",
    question: "Why did my timetable disappear?",
    answer:
      "Your timetable is saved in your browser's localStorage. It stays between visits on the same device and browser, but clears if you wipe your browser data, close an incognito window, or switch to a different device or browser. There is no account system, so nothing is synced to the cloud."
  },
  {
    id: "data-tracking",
    group: "your-data",
    question: "Do you track my data?",
    answer: (
      <>
        We use two analytics tools, Google Analytics and PostHog, to collect
        page views, usage patterns and error reports. We don&apos;t record your
        screen or sessions. We don&apos;t collect your name or contact details.
        Everything you add to your timetable is stored only in your browser and
        never sent to our servers. See the{" "}
        <TextLink href="/privacy">Privacy Policy</TextLink> for full details.
        The CGPA and FGO tools read your transcript PDF in your browser and
        never upload the file. By default, module codes, terms and grades (never
        your name or matric number) are also sent for analytics. Untick the
        share box before uploading to opt out.
      </>
    ),
    answerText:
      "We use two analytics tools, Google Analytics and PostHog, to collect page views, usage patterns and error reports. We don't record your screen or sessions. We don't collect your name or contact details. Everything you add to your timetable is stored only in your browser and never sent to our servers. The CGPA and FGO tools read your transcript PDF in your browser and never upload the file. By default, module codes, terms and grades (never your name or matric number) are also sent for analytics. Untick the share box before uploading to opt out."
  },
  {
    id: "open-source",
    group: "open-source-and-contributing",
    question: "Is NTUMods open source?",
    answer: (
      <>
        Yes. The code is released under the MIT licence and lives on{" "}
        <TextLink href={REPO_URL} target="_blank" rel="noopener noreferrer">
          GitHub
        </TextLink>
        . Module and exam data belongs to NTU and is presented here for
        convenience.
      </>
    ),
    answerText:
      "Yes. The code is released under the MIT licence and lives on GitHub at github.com/Dallas-Ng/ntu-mods. Module and exam data belongs to NTU and is presented here for convenience."
  },
  {
    id: "contribute",
    group: "open-source-and-contributing",
    question: "How can I contribute?",
    answer: (
      <>
        Everyone is welcome, and you do not need to be an NTU student. For
        anything beyond a small fix, open an issue first so we can agree on the
        approach. Then fork the repository, make your change, run the checks and
        open a pull request. The steps are in{" "}
        <TextLink
          href={`${REPO_URL}/blob/main/CONTRIBUTING.md`}
          target="_blank"
          rel="noopener noreferrer">
          CONTRIBUTING.md
        </TextLink>
        . Typo fixes, bug reports, accessibility and performance improvements
        and new articles are all useful.
      </>
    ),
    answerText:
      "Everyone is welcome, and you do not need to be an NTU student. For anything beyond a small fix, open an issue first so we can agree on the approach. Then fork the repository, make your change, run the checks and open a pull request. The steps are in CONTRIBUTING.md in the repository. Typo fixes, bug reports, accessibility and performance improvements and new articles are all useful."
  },
  {
    id: "report-bug-or-wrong-data",
    group: "open-source-and-contributing",
    question: "How do I report a bug or wrong data?",
    answer: (
      <>
        Use the <TextLink href="/feedback">feedback form</TextLink> or open a{" "}
        <TextLink
          href={`${REPO_URL}/issues/new/choose`}
          target="_blank"
          rel="noopener noreferrer">
          GitHub issue
        </TextLink>
        . For wrong module data, include the module code and semester.
      </>
    ),
    answerText:
      "Use the feedback form or open a GitHub issue. For wrong module data, include the module code and semester."
  },
  {
    id: "report-security-issue",
    group: "open-source-and-contributing",
    question: "How do I report a security issue?",
    answer: (
      <>
        Please do not open a public issue. Use GitHub&apos;s private
        vulnerability reporting, described in{" "}
        <TextLink
          href={`${REPO_URL}/blob/main/SECURITY.md`}
          target="_blank"
          rel="noopener noreferrer">
          SECURITY.md
        </TextLink>{" "}
        and in the site&apos;s{" "}
        <TextLink href="/.well-known/security.txt">security.txt</TextLink>.
      </>
    ),
    answerText:
      "Please do not open a public issue. Use GitHub's private vulnerability reporting, described in SECURITY.md in the repository and in the site's security.txt at /.well-known/security.txt."
  }
]

export const faqHeadings: ArticleHeading[] = FAQ_GROUPS.flatMap((group) => [
  { id: group.id, depth: 2, text: group.title },
  ...FAQ_CONFIG.filter((item) => item.group === group.id).map(
    ({ id, question }) => ({ id, depth: 3, text: question })
  )
])

/** Question/answer pairs for the FAQPage JSON-LD built in the faq page. */
export const faqItems = FAQ_CONFIG.map(({ question, answer, answerText }) => ({
  question,
  answer: answerText ?? (answer as string)
}))

interface Props {
  /** Rendered as the second grid column, the .astro page passes its own
   * ArticleToc island here so this component can stay a zero-JS static
   * render (it has no interactivity of its own). */
  children?: React.ReactNode
  /** Sticky section picker for screens without the side nav; passed as the
   * `mobileNav` named slot for the same reason as `children`. */
  mobileNav?: React.ReactNode
}

const FaqContent = ({ children, mobileNav }: Props) => {
  return (
    <Container size="md">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,48rem)_16rem] [&>*]:min-w-0">
        <div className="space-y-8">
          {mobileNav}

          <Header
            title="Frequently asked questions"
            subtitle="Answers for planning timetables, browsing modules, exporting schedules, understanding how your data is stored, and contributing to the open-source project."
          />

          {FAQ_GROUPS.map((group) => (
            <div key={group.id} className="space-y-3">
              <h2
                id={group.id}
                className="scroll-mt-20 pt-2 text-2xl font-semibold tracking-tight">
                {group.title}
                <HeadingAnchor id={group.id} label={group.title} />
              </h2>

              {FAQ_CONFIG.filter((item) => item.group === group.id).map(
                ({ id, question, answer }) => (
                  <section
                    id={id}
                    key={id}
                    className={cn(
                      cardVariants(),
                      "scroll-mt-20 space-y-3 p-5"
                    )}>
                    <SectionHeading as="h3">
                      {question}
                      <HeadingAnchor id={id} label={question} />
                    </SectionHeading>

                    <p className="text-sm leading-relaxed">{answer}</p>
                  </section>
                )
              )}
            </div>
          ))}

          <div
            id="feedback"
            className={cn(
              cardVariants(),
              "flex scroll-mt-20 flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center"
            )}>
            <div>
              <SectionHeading>
                Feedback
                <HeadingAnchor id="feedback" label="Feedback" />
              </SectionHeading>

              <p className="text-muted-foreground text-sm">
                Have a problem or suggestion? Let us know.
              </p>
            </div>

            <a href="/feedback">
              <Button>Share feedback</Button>
            </a>
          </div>
        </div>

        {children}
      </div>
    </Container>
  )
}

export default FaqContent
