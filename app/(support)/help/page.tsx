import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { HELP_CONFIG } from "@/config/help"
import { Button } from "@/components/ui/button"

export default function HelpPage() {
  return (
    <div className="max-w-6xl">
      <h1 className="bg-gradient-to-r from-emerald-500 to-emerald-900 bg-clip-text text-3xl font-bold text-transparent">
        Frequently Asked Questions
      </h1>

      <div className="my-5">
        <p className="mb-2">
          If your application does not load or has problems, click button below
        </p>

        <Link href="/debug">
          <Button variant="outline">Click here if you are stuck!</Button>
        </Link>
      </div>

      {HELP_CONFIG.map(({ question, answer }, i) => (
        <div className="mt-6" key={i}>
          <h2 className="text-xl font-bold">{question}</h2>

          <p className="mt-2">{answer}</p>
        </div>
      ))}

      <div className="mt-[50px]">
        <Link
          href="/stars"
          className="flex items-center transition-colors duration-300 hover:text-slate-400">
          <ArrowLeft className="h-5 w-5" /> Back to Stars
        </Link>
      </div>
    </div>
  )
}
