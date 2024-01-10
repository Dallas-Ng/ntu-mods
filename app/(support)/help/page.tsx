import Link from "next/link"
import { ArrowLeft, Mail, ServerCrash } from "lucide-react"

import { HELP_CONFIG } from "@/config/help"
import { siteConfig } from "@/config/site"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function HelpPage() {
  return (
    <>
      <div className="p-5">
        <Link
          href="/stars"
          className="flex items-center transition-colors hover:text-secondary-foreground">
          <ArrowLeft className="h-5 w-5" /> Back to Stars
        </Link>
      </div>

      <div className="flex flex-col gap-2 md:flex-row">
        <div className="p-5">
          <h1 className="mb-2 bg-gradient-to-r from-emerald-600 to-emerald-900 bg-clip-text text-2xl font-bold text-transparent">
            Frequently Asked Questions
          </h1>

          <p className="text-secondary">
            Can&apos;t find the answer you&apos;re looking for? <br />
            <a
              href="mailto:ngdallas1@gmail.com"
              className="text-primary hover:underline">
              <span className="flex items-center gap-1">
                Reach out to me <Mail className="h-5 w-5" />
              </span>
            </a>
            or{" "}
            <Link
              href={siteConfig.links.telegram}
              target="_blank"
              className="text-primary hover:underline">
              DM on telegram @dallas_ng
            </Link>
          </p>
        </div>

        <div className="p-5 md:w-[70%]">
          {HELP_CONFIG.map(({ question, answer }, i) => (
            <div className="mb-[3rem]" key={i}>
              <h2 className="text-xl font-bold">{question}</h2>

              <p className="mt-2 text-secondary">{answer}</p>
            </div>
          ))}

          <Link href="/debug">
            <Alert>
              <ServerCrash className="h-5 w-5" />

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
