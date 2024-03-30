import Link from "next/link"
import { Mail, ServerCrash } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import FeedbackCard from "@/components/feedback-card"
import Header from "@/components/header"

interface HelpConfig {
  question: React.ReactNode
  answer: React.ReactNode
}

const HELP_CONFIG: HelpConfig[] = [
  {
    question: "What is this website for?",
    answer:
      "This website is a tool for Nanyang Technological University (NTU) students to plan for their courses / modules during the course registration period or for browsing modules offered by NTU. It allows you to navigate seamlessly on one platform rather than using the school's website."
  },
  {
    question: "How do I use this website?",
    answer: (
      <>
        If you wish to plan for your courses you can use the{" "}
        <Link
          href="/timetable"
          className="text-blue-500 transition-colors hover:text-blue-600">
          timetable
        </Link>{" "}
        planner to do so. If you want to browse through all available indexes,
        modules and related information, you can use the{" "}
        <Link
          href="/mods"
          className="text-blue-500 transition-colors hover:text-blue-600">
          mods
        </Link>{" "}
        page.
      </>
    )
  },
  {
    question: "How does this help me in STARS?",
    answer:
      "It gets tiring trying to see which index fits into your timetable, its even worse when your ICC mods indexes such as CC0005 and CC0003 isn't even shown on the NTU Stars Planner. This website allows you to see all the indexes available for a module and allows you to plan for your timetable."
  },
  {
    question: "Can you include vacanies for indexes?",
    answer:
      "Currently, there is no way for us to include vacancies for indexes as we do not have access to the school's database. However, we are looking into ways to do so."
  },
  {
    question: "Can you update your system to include...?",
    answer: (
      <>
        We have updated the system for{" "}
        <span className="underline">Academic Year 2023-2024 Semester 2</span>.
        If you have any missing courses or suggestions, please feel free to
        email me or send a feedback below.
      </>
    )
  },
  {
    question: "Do you track my data?",
    answer:
      "We do track the number of users and user activity, but we do not track any of your personal data (we do not have access to it anyways). Everything is done on your local browser."
  },
  {
    question: "There is something wrong with the system!",
    answer:
      "You can contact me via email or use the debug page to reset the system."
  }
]

export default function HelpPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-10 lg:mt-5">
      <div className="space-y-5">
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
      </div>

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
