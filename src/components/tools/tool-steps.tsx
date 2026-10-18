import type { ReactNode } from "react"

// The numbered "how it works" cards under a tool's upload prompt.
export function ToolSteps({
  steps
}: {
  steps: { title: string; body: ReactNode }[]
}) {
  return (
    <ol className="grid gap-4 sm:grid-cols-3">
      {steps.map((step, i) => (
        <li key={step.title} className="bg-muted space-y-2 rounded-2xl p-5">
          <span className="bg-background text-muted-foreground flex size-6 items-center justify-center rounded-full text-xs font-semibold">
            {i + 1}
          </span>
          <p className="text-sm font-medium">{step.title}</p>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {step.body}
          </p>
        </li>
      ))}
    </ol>
  )
}
