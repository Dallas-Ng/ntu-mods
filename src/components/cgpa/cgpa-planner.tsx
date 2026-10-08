"use client"

import { useRef, useState } from "react"
import { Lock, Upload } from "lucide-react"
import posthog from "posthog-js"

import {
  classFor,
  gradedTotals,
  gradeFor,
  planBands,
  projectedCgpa,
  type BandResult
} from "@/lib/cgpa"
import { readTranscriptPdf } from "@/lib/fgo"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const TRANSCRIPT_URL =
  "https://wis.ntu.edu.sg/webexe/owa/request_transcript_und.LoginN?pType=SH"

// Events carry flags only: never grades or AU.
const track = (event: string, props?: Record<string, unknown>) =>
  posthog.capture(`cgpa_${event}`, props)

const fmt = (n: number) => n.toFixed(2)

// Letters marked under the scale, positioned by grade points from D (1) to A (5).
const SCALE = [
  ["D", 1],
  ["C", 2],
  ["B-", 3],
  ["B", 3.5],
  ["B+", 4],
  ["A-", 4.5],
  ["A", 5]
] as const
const pct = (gp: number) => `${((Math.max(1, Math.min(5, gp)) - 1) / 4) * 100}%`

const STATUS_DOT = {
  secured: "bg-emerald-500",
  possible: "bg-primary",
  "out of reach": "bg-muted-foreground/40"
} as const

const STATUS_TEXT = {
  secured: "Secured",
  possible: "Within reach",
  "out of reach": "Out of reach"
} as const

function Field({
  id,
  label,
  hint,
  value,
  step,
  onChange
}: {
  id: string
  label: string
  hint: string
  value: string
  step: string
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        min={0}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <p className="text-muted-foreground text-xs">{hint}</p>
    </div>
  )
}

/** Grade scale with a marker for the average the remaining AU need. */
function Scale({ needed }: { needed: number }) {
  return (
    <div className="pt-2 pb-6">
      <div className="bg-muted relative h-2.5 rounded-full">
        <div
          className="bg-primary absolute inset-y-0 left-0 rounded-full transition-all"
          style={{ width: pct(needed) }}
        />
        <span
          className="bg-background border-primary absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-all"
          style={{ left: pct(needed) }}
        />
        {SCALE.map(([g, gp]) => (
          <span
            key={g}
            className="text-muted-foreground absolute top-5 -translate-x-1/2 text-[10px] tabular-nums"
            style={{ left: pct(gp) }}>
            {g}
          </span>
        ))}
      </div>
    </div>
  )
}

const CgpaPlanner = () => {
  const input = useRef<HTMLInputElement>(null)
  const [cgpa, setCgpa] = useState("")
  const [doneAu, setDoneAu] = useState("")
  const [leftAu, setLeftAu] = useState("")
  const [goal, setGoal] = useState("")
  const [whatIf, setWhatIf] = useState(4)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")

  async function load(file: File | undefined) {
    if (!file) return
    setBusy(true)
    setError("")
    try {
      const { mods } = await readTranscriptPdf(file)
      const { points, au } = gradedTotals(mods)
      if (au === 0) throw new Error("no modules found")
      setCgpa(fmt(points / au))
      setDoneAu(String(au))
      track("transcript_loaded")
    } catch {
      track("upload_failed")
      setError(
        "Could not read that PDF. Use the official transcript from the NTU Self-Help Transcript System, or type your CGPA."
      )
    } finally {
      setBusy(false)
    }
  }

  const c = Number(cgpa)
  const d = Number(doneAu)
  const r = Number(leftAu)
  const valid =
    cgpa !== "" && c >= 0 && c <= 5 && d > 0 && leftAu !== "" && r > 0
  const bands = valid ? planBands(c, d, r) : []
  const active: BandResult | undefined =
    bands.find((b) => b.label === goal) ??
    bands.find((b) => b.status === "possible") ??
    bands[0]
  const final = valid ? projectedCgpa(c, d, r, whatIf) : 0

  return (
    <div className="space-y-6">
      <input
        ref={input}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          void load(e.target.files?.[0])
          e.target.value = ""
        }}
      />

      <section className="bg-card space-y-5 rounded-xl border p-5">
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <Field
            id="cgpa"
            label="Current CGPA"
            hint="Out of 5.00"
            value={cgpa}
            step="0.01"
            onChange={setCgpa}
          />
          <Field
            id="done"
            label="AU done"
            hint="Letter-graded"
            value={doneAu}
            step="0.5"
            onChange={setDoneAu}
          />
          <Field
            id="left"
            label="AU left"
            hint="After any FGO"
            value={leftAu}
            step="0.5"
            onChange={setLeftAu}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t pt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => input.current?.click()}>
            <Upload /> {busy ? "Reading..." : "Fill from transcript PDF"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setCgpa("3.72")
              setDoneAu("78")
              setLeftAu("54")
              setError("")
              track("sample_loaded")
            }}>
            Try sample
          </Button>
          <p className="text-muted-foreground basis-full pt-1 text-xs">
            <Lock className="mr-1.5 inline size-3.5 align-[-2px]" /> Read in
            your browser, never uploaded.{" "}
            <a
              href={TRANSCRIPT_URL}
              onClick={() => track("transcript_link_clicked")}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline">
              Get your transcript
            </a>
          </p>
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}
      </section>

      {!active ? (
        <p className="text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm">
          Enter your CGPA and AU to see the grades you need for each honours
          class.
        </p>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-sm font-medium">Pick a goal</h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {bands.map((b) => (
                <button
                  key={b.label}
                  type="button"
                  aria-pressed={b === active}
                  onClick={() => {
                    setGoal(b.label)
                    track("goal_selected", { goal: b.label })
                  }}
                  className={cn(
                    "bg-card space-y-1 rounded-lg border p-3 text-left transition-colors",
                    b === active
                      ? "border-primary ring-primary ring-1"
                      : "hover:bg-accent"
                  )}>
                  <p className="text-sm leading-tight font-medium">{b.label}</p>
                  <p className="text-muted-foreground text-xs">
                    CGPA {fmt(b.min)}+
                  </p>
                  <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
                    <span
                      className={cn(
                        "size-1.5 rounded-full",
                        STATUS_DOT[b.status]
                      )}
                    />
                    {STATUS_TEXT[b.status]}
                  </p>
                </button>
              ))}
            </div>
          </section>

          <section className="bg-card space-y-3 rounded-xl border p-5">
            <p className="text-muted-foreground text-sm">
              To finish with {active.label} (CGPA {fmt(active.min)}), your next{" "}
              {r} AU need
            </p>
            {active.status === "possible" && (
              <>
                <p className="text-3xl font-semibold tracking-tight">
                  {active.grade} or better{" "}
                  <span className="text-muted-foreground mt-1 block text-base font-normal tabular-nums">
                    on average ({fmt(active.required)} points)
                  </span>
                </p>
                <Scale needed={active.required} />
              </>
            )}
            {active.status === "secured" && (
              <p className="text-xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400">
                Nothing. It is already secured.
              </p>
            )}
            {active.status === "out of reach" && (
              <>
                <p className="text-xl font-semibold tracking-tight">
                  More than an A average, so it is out of reach.
                </p>
                <p className="text-muted-foreground text-sm">
                  Straight As over {r} AU would finish you on{" "}
                  {fmt(projectedCgpa(c, d, r, 5))}.
                </p>
              </>
            )}
          </section>

          <section className="bg-card space-y-3 rounded-xl border p-5">
            <div className="flex items-baseline justify-between gap-3">
              <label htmlFor="whatif" className="text-sm font-medium">
                What if you average...
              </label>
              <span className="text-sm font-medium tabular-nums">
                {fmt(whatIf)}
                <span className="text-muted-foreground font-normal">
                  {" "}
                  about {gradeFor(whatIf) ?? "A"}
                </span>
              </span>
            </div>
            <input
              id="whatif"
              type="range"
              min={1}
              max={5}
              step={0.1}
              value={whatIf}
              onChange={(e) => setWhatIf(Number(e.target.value))}
              onPointerUp={() => track("what_if_used")}
              className="accent-primary w-full"
            />
            <p className="text-sm">
              You would finish on{" "}
              <span className="font-semibold tabular-nums">{fmt(final)}</span>,{" "}
              {classFor(final) ?? "below Honours"}.
            </p>
          </section>

          <p className="text-muted-foreground text-xs">
            Assumes every remaining AU is letter-graded and earns the same
            average. Some programmes set their own honours bands, so confirm
            with your school. This tool is not official.
          </p>
        </>
      )}
    </div>
  )
}

export default CgpaPlanner
