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

const CgpaPlanner = () => {
  const input = useRef<HTMLInputElement>(null)
  const [cgpa, setCgpa] = useState("")
  const [doneAu, setDoneAu] = useState("")
  const [leftAu, setLeftAu] = useState("")
  const [goal, setGoal] = useState("")
  const [whatIf, setWhatIf] = useState<number | null>(null)
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
  // Grades sit 0.5 apart, so the slider snaps to them. Until it is touched,
  // assume the student keeps their current pace.
  const avg = whatIf ?? Math.min(5, Math.max(1, Math.round(c * 2) / 2))
  const final = valid ? projectedCgpa(c, d, r, avg) : 0
  const finalClass = classFor(final)

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

      <section className="space-y-5 rounded-lg border-2 p-4">
        <h2 className="text-sm font-medium">Your grades so far</h2>
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
            size="sm"
            disabled={busy}
            onClick={() => input.current?.click()}>
            <Upload /> {busy ? "Reading..." : "Fill from transcript PDF"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => {
              setCgpa("3.72")
              setDoneAu("78")
              setLeftAu("54")
              setError("")
              track("sample_loaded")
            }}>
            Try with sample data
          </Button>
          <p className="text-muted-foreground basis-full pt-1 text-xs">
            <Lock className="mr-1.5 inline size-3.5 align-[-2px]" /> Read in
            your browser. Nothing is uploaded.{" "}
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
        <p className="text-muted-foreground rounded-lg border-2 border-dashed p-8 text-center text-sm">
          Enter your CGPA and AU to see the grades you need for each honours
          class.
        </p>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-sm font-medium">Pick a goal</h2>
            <p className="text-muted-foreground -mt-2 text-xs">
              See the average grade it takes to finish in each class.
            </p>
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
                      ? "border-primary bg-primary/5 ring-primary ring-1"
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

          <section className="space-y-4 rounded-lg border-2 p-4">
            <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              {active.label} · CGPA {fmt(active.min)}+
            </p>
            {active.status === "possible" && (
              <>
                <div className="space-y-1">
                  <p className="text-3xl font-semibold tracking-tight">
                    Average {active.grade} or better
                  </p>
                  <p className="text-muted-foreground text-sm">
                    That is {fmt(active.required)} grade points or more across
                    your remaining {r} AU.
                  </p>
                </div>
              </>
            )}
            {active.status === "secured" && (
              <div className="space-y-1">
                <p className="text-3xl font-semibold tracking-tight text-emerald-600 dark:text-emerald-400">
                  Already secured
                </p>
                <p className="text-muted-foreground text-sm">
                  No set of grades over your remaining {r} AU can take you below{" "}
                  {fmt(active.min)}.
                </p>
              </div>
            )}
            {active.status === "out of reach" && (
              <div className="space-y-1">
                <p className="text-3xl font-semibold tracking-tight">
                  Out of reach
                </p>
                <p className="text-muted-foreground text-sm">
                  It needs more than an A average. Straight As over your
                  remaining {r} AU would finish you on{" "}
                  {fmt(projectedCgpa(c, d, r, 5))}.
                </p>
              </div>
            )}
          </section>

          <section className="space-y-5 rounded-lg border-2 p-4">
            <div className="space-y-1">
              <h2 className="text-sm font-medium">Where would you finish?</h2>
              <p className="text-muted-foreground text-xs">
                Drag to the average grade you expect over your remaining {r} AU.
              </p>
            </div>

            <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
              <div>
                <p className="text-muted-foreground text-xs">If you average</p>
                <p className="text-4xl font-semibold tabular-nums">
                  {gradeFor(avg)}{" "}
                  <span className="text-muted-foreground text-sm font-normal">
                    ({avg.toFixed(1)} points)
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground text-xs">
                  Projected final CGPA
                </p>
                <p className="flex items-baseline justify-end gap-2">
                  <span className="text-4xl font-semibold tabular-nums">
                    {fmt(final)}
                  </span>
                  {final - c > 0.005 && (
                    <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                      +{fmt(final - c)}
                    </span>
                  )}
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      finalClass
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}>
                    {finalClass ?? "Below Honours"}
                  </span>
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              {active.status === "possible" && (
                <div className="relative mx-2 h-5">
                  <span
                    className={cn(
                      "text-primary absolute bottom-0 flex flex-col text-[11px] font-medium whitespace-nowrap",
                      active.required > 4
                        ? "-translate-x-full items-end"
                        : active.required < 2
                          ? "items-start"
                          : "-translate-x-1/2 items-center"
                    )}
                    style={{ left: pct(active.required) }}>
                    {active.label} needs {fmt(active.required)}
                  </span>
                </div>
              )}
              <div className="relative">
                {active.status === "possible" && (
                  <span
                    aria-hidden
                    className="bg-primary absolute -top-1 h-2 w-px"
                    style={{
                      left: `calc(0.5rem + (100% - 1rem) * ${(active.required - 1) / 4})`
                    }}
                  />
                )}
                <input
                  id="whatif"
                  type="range"
                  aria-label="Average grade points over your remaining AU"
                  min={1}
                  max={5}
                  step={0.5}
                  value={avg}
                  onChange={(e) => setWhatIf(Number(e.target.value))}
                  onPointerUp={() => track("what_if_used")}
                  className="accent-primary block w-full cursor-pointer"
                />
              </div>
              {/* Inset by the thumb radius so letters line up with the thumb */}
              <div className="relative mx-2 h-3">
                {SCALE.map(([g, gp]) => (
                  <span
                    key={g}
                    className="text-muted-foreground absolute -translate-x-1/2 text-[10px]"
                    style={{ left: pct(gp) }}>
                    {g}
                  </span>
                ))}
              </div>
            </div>
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
