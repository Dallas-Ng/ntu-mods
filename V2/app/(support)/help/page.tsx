import Link from "next/link"
import { ArrowLeft, Mail, ServerCrash } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface HelpConfig {
  question: React.ReactNode
  answer: React.ReactNode
}

const HELP_CONFIG: HelpConfig[] = [
  {
    question: "What is this website for?",
    answer:
      "This website is for the students of the Nanyang Technological University to help them plan their timetable and see what courses/indexes are available in the upcoming terms."
  },
  {
    question: "How do I use this website?",
    answer:
      "On the stars page, click on the add course button, after which you can use the search bar to search for courses. Click on the course to see the indexes available for that course. After adding an index, the timetable will be updated automatically."
  },
  {
    question: "How does this help me in stars?",
    answer:
      "While we do not help track vacanies right now, we provide you a way to plan your courses and indexes before stars opens and allow you to share with your friends if you want to take the same index."
  },
  {
    question: "Can you update your system to include...?",
    answer: (
      <>
        We have updated the system for{" "}
        <span className="underline">Academic Year 2023-2024 Semester 2</span>.
        If you have any missing courses or suggestions, please feel free to
        email me.
      </>
    )
  },
  {
    question: "Do you track my data?",
    answer:
      "We do track the number of users and user activity, but we do not track any of your personal data (we do not have access to it anyways)."
  }
]

export default function HelpPage() {
  return (
    <>
      <div className="p-5">
        <Link
          href="/timetable"
          className="flex items-center transition-colors hover:text-primary-alt">
          <ArrowLeft className="size-5" /> Back to Stars
        </Link>
      </div>

      <div className="flex flex-col gap-2 md:flex-row">
        <div className="p-5">
          <h1 className="mb-2 bg-gradient-to-r from-indigo-600 to-indigo-900 bg-clip-text text-2xl font-bold text-transparent">
            Frequently Asked Questions
          </h1>

          <p className="text-muted-foreground">
            Can&apos;t find the answer you&apos;re looking for? <br />
            <a
              href="mailto:ngdallas1@gmail.com"
              className="text-primary hover:underline">
              <span className="flex items-center gap-1">
                Reach out to me <Mail className="size-5" />
              </span>
            </a>
          </p>
        </div>

        <div className="p-5 md:w-[70%]">
          {HELP_CONFIG.map(({ question, answer }, i) => (
            <div className="mb-[3rem]" key={i}>
              <h2 className="text-xl font-bold">{question}</h2>

              <p className="mt-2 text-muted-foreground">{answer}</p>
            </div>
          ))}

          <Link href="/debug">
            <Alert>
              <ServerCrash className="size-5" />

              <AlertTitle>Having Problems with the System?</AlertTitle>

              <AlertDescription>
                Click here if you need to reset the application
              </AlertDescription>
            </Alert>
          </Link>
        </div>
      </div>
    </>
  )
}
