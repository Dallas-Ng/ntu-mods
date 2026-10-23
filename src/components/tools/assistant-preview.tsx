"use client"

import { useEffect, useState } from "react"

import { CLAUDE_COLOUR, ClaudeIcon, OpenAIIcon } from "@/components/brand-icons"

// Exchanges that loop in the preview. The answers are real SC1004 data from
// src/data/api, shortened with an ellipsis.
const STEPS = [
  {
    q: "What is SC1004?",
    tool: "get_module",
    a: "Linear Algebra for Computing, 4 AU, CSC. Linear algebra and complex numbers for machine learning, computer graphics and data science…"
  },
  {
    q: "What indexes does it have?",
    tool: "get_module_indexes",
    a: "3 indexes this semester. Index 10052: lecture Wed 0930-1120 and Mon 1230-1320 in LT3, tutorial Mon 1630-1720 in TR+19…"
  },
  {
    q: "When is the exam?",
    tool: "get_exam",
    a: "The Semester 1 exam is on 23 November 2026, 5.00 pm to 7.00 pm."
  }
]

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

type Item = {
  id: number
  n: number
  sent: boolean
  tool: boolean
  answer: boolean
}

// Grows from zero height, so the thread above is pushed up smoothly as each
// part appears, with no scrolling to chase it.
const Reveal = ({
  open,
  children
}: {
  open: boolean
  children: React.ReactNode
}) => (
  <div
    className={`grid transition-[grid-template-rows,opacity] duration-500 ease-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
    <div className="overflow-hidden">{children}</div>
  </div>
)

const AssistantPreview = ({ compact = false }: { compact?: boolean }) => {
  const [items, setItems] = useState<Item[]>([
    { id: 0, n: 0, sent: true, tool: true, answer: true }
  ])
  const [typed, setTyped] = useState<string | null>(null)

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    let live = true
    const patch = (id: number, p: Partial<Item>) =>
      setItems((list) =>
        list.map((it) => (it.id === id ? { ...it, ...p } : it))
      )
    const run = async () => {
      setItems([])
      for (let id = 0; live; id++) {
        const n = id % STEPS.length
        const { q } = STEPS[n]
        for (let c = 1; c <= q.length && live; c++) {
          setTyped(q.slice(0, c))
          await sleep(45)
        }
        await sleep(350)
        setTyped(null)
        // Older exchanges stay and scroll up; only the last few are kept.
        setItems((list) =>
          [...list, { id, n, sent: false, tool: false, answer: false }].slice(
            -4
          )
        )
        await sleep(30)
        patch(id, { sent: true })
        await sleep(600)
        patch(id, { tool: true })
        await sleep(1000)
        patch(id, { answer: true })
        await sleep(2800)
      }
    }
    run()
    return () => {
      live = false
    }
  }, [])

  return (
    <div
      className={`flex w-full max-w-md flex-col gap-3 text-sm ${compact ? "-mt-4" : ""}`}
      aria-hidden>
      <div
        className={`flex flex-col justify-end overflow-hidden ${compact ? "h-36" : "h-44 md:h-64"}`}>
        {items.map(({ id, n, sent, tool, answer }, idx) => (
          <div
            key={id}
            className={`transition-opacity duration-500 ${idx < items.length - 1 ? "opacity-40" : ""}`}>
            <Reveal open={sent}>
              {/* the gap above is inside the Reveal, so it grows with it instead of jumping */}
              <div className="pt-5">
                <p className="bg-muted ml-auto w-fit max-w-[85%] rounded-2xl px-3.5 py-2">
                  {STEPS[n].q}
                </p>
              </div>
            </Reveal>
            <Reveal open={tool}>
              <p className="text-muted-foreground flex w-fit items-center gap-1.5 pt-2.5 text-xs">
                <ClaudeIcon
                  className="size-3.5"
                  style={{ color: CLAUDE_COLOUR }}
                />
                <OpenAIIcon className="size-3.5" />
                Used NTUMods: {STEPS[n].tool}
              </p>
            </Reveal>
            <Reveal open={answer}>
              <p className="pt-2.5 leading-relaxed">{STEPS[n].a}</p>
            </Reveal>
          </div>
        ))}
      </div>
      <div className="bg-muted flex items-center justify-between gap-3 rounded-2xl px-4 py-3">
        <span className="flex h-5 items-center">
          {typed === null ? (
            <span className="text-muted-foreground">Ask about NTU modules</span>
          ) : (
            <>
              {typed}
              <span className="bg-foreground ml-0.5 inline-block h-4 w-0.5" />
            </>
          )}
        </span>
        <span className="bg-primary text-primary-foreground grid size-7 shrink-0 place-items-center rounded-lg">
          ↑
        </span>
      </div>
    </div>
  )
}

export default AssistantPreview
