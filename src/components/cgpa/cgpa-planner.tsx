"use client"

import { useRef, useState } from "react"
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
import { shareTranscript } from "@/lib/transcript-share"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { ToolSteps } from "@/components/tools/tool-steps"
import { TranscriptDropzone } from "@/components/tools/transcript-dropzone"
import { TranscriptSource } from "@/components/tools/transcript-source"

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

// Concave corners that blend the sliding tab "head" into the panel below.
const CURVE_LEFT =
  "radial-gradient(circle at 0 0, transparent 1rem, hsl(var(--muted)) calc(1rem + 0.5px))"
const CURVE_RIGHT =
  "radial-gradient(circle at 100% 0, transparent 1rem, hsl(var(--muted)) calc(1rem + 0.5px))"

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
        className="bg-background"
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
  const [share, setShare] = useState(true)
  const [source, setSource] = useState<{ sample: boolean; name: string }>()

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
      setSource({ sample: false, name: file.name })
      track("transcript_loaded")
      if (share) shareTranscript("cgpa", mods)
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
  // Lowest class first, so goals climb left to right like the slider.
  const bands = valid ? planBands(c, d, r).reverse() : []
  const active: BandResult | undefined =
    bands.find((b) => b.label === goal) ??
    // Default to the highest class still within reach.
    bands.findLast((b) => b.status === "possible") ??
    bands[bands.length - 1]
  // Grades sit 0.5 apart, so the slider snaps to them. Until it is touched,
  // assume the student keeps their current pace.
  const avg = whatIf ?? Math.min(5, Math.max(1, Math.round(c * 2) / 2))
  const activeIdx = active ? bands.indexOf(active) : 0
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

      {source ? (
        <>
          <TranscriptSource
            sample={source.sample}
            fileName={source.name}
            summary="CGPA and AU filled in below"
            onUpload={() => input.current?.click()}
          />
          {error && <p className="text-destructive text-sm">{error}</p>}
        </>
      ) : (
        <TranscriptDropzone
          busy={busy}
          error={error}
          share={share}
          onShareChange={setShare}
          onFile={(f) => void load(f)}
          onChoose={() => input.current?.click()}
          onSample={() => {
            setSource({ sample: true, name: "Sample data" })
            setCgpa("3.72")
            setDoneAu("78")
            setLeftAu("54")
            setError("")
            track("sample_loaded")
          }}
          onLinkClick={() => track("transcript_link_clicked")}
          description="Drop the official PDF here to fill the fields below, or enter them yourself."
        />
      )}

      <section className="bg-muted space-y-5 rounded-2xl p-5">
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
      </section>

      {!active ? (
        <ToolSteps
          steps={[
            {
              title: "Add your grades",
              body: "Upload your transcript, or type your CGPA and the AU you have done and still have left."
            },
            {
              title: "Pick a goal",
              body: "Choose an honours class to see the average grade you need over your remaining AU."
            },
            {
              title: "Test what-ifs",
              body: "Drag the slider to see where a given average grade would leave your final CGPA."
            }
          ]}
        />
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="text-sm font-medium">Pick a goal</h2>
            <div>
              {/* Tabs: one sliding "head" joins the picked goal to the panel */}
              <div className="bg-muted/40 relative grid grid-cols-4 rounded-t-2xl">
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-1/4 transition-transform duration-300 ease-out motion-reduce:transition-none"
                  style={{ transform: `translateX(${activeIdx * 100}%)` }}>
                  <span className="bg-muted absolute inset-0 rounded-t-2xl" />
                  <span
                    className={cn(
                      "absolute bottom-0 -left-4 size-4 transition-opacity duration-300",
                      activeIdx === 0 && "opacity-0"
                    )}
                    style={{ background: CURVE_LEFT }}
                  />
                  <span
                    className={cn(
                      "absolute -right-4 bottom-0 size-4 transition-opacity duration-300",
                      activeIdx === bands.length - 1 && "opacity-0"
                    )}
                    style={{ background: CURVE_RIGHT }}
                  />
                </span>
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
                      "relative z-10 space-y-1 px-2.5 pt-3 pb-4 text-left transition-colors sm:px-4",
                      b === active
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    )}>
                    <p className="text-xs leading-tight font-medium sm:text-sm">
                      <span className="sm:hidden">
                        {b.label.replace("Highest Distinction", "Highest")}
                      </span>
                      <span className="hidden sm:inline">{b.label}</span>
                    </p>
                    <p className="hidden text-xs sm:block">
                      CGPA {fmt(b.min)}+
                    </p>
                    <p className="hidden items-center gap-1.5 text-xs sm:flex">
                      <span
                        className={cn(
                          "size-1.5 shrink-0 rounded-full",
                          STATUS_DOT[b.status]
                        )}
                      />
                      {STATUS_TEXT[b.status]}
                    </p>
                    {/* Phones: one compact line, the status is the dot */}
                    <p className="flex items-center gap-1.5 text-xs sm:hidden">
                      <span
                        className={cn(
                          "size-1.5 shrink-0 rounded-full",
                          STATUS_DOT[b.status]
                        )}
                      />
                      <span className="sr-only">{STATUS_TEXT[b.status]}</span>
                      {fmt(b.min)}+
                    </p>
                  </button>
                ))}
              </div>

              <div
                className={cn(
                  "bg-muted space-y-8 rounded-tl-2xl rounded-tr-2xl rounded-b-2xl p-5 transition-[border-radius] duration-300 motion-reduce:transition-none md:p-6",
                  activeIdx === 0 && "rounded-tl-none",
                  activeIdx === bands.length - 1 && "rounded-tr-none"
                )}>
                <div className="space-y-3">
                  <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    {active.label} · CGPA {fmt(active.min)}+
                  </p>
                  {active.status === "possible" && (
                    <>
                      <div className="space-y-1">
                        <p className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                          Average {active.grade} or better
                        </p>
                        <p className="text-muted-foreground text-sm">
                          That is {fmt(active.required)} grade points or more
                          across your remaining {r} AU.
                        </p>
                      </div>
                    </>
                  )}
                  {active.status === "secured" && (
                    <div className="space-y-1">
                      <p className="text-4xl font-bold tracking-tighter text-emerald-600 md:text-5xl dark:text-emerald-400">
                        Already secured
                      </p>
                      <p className="text-muted-foreground text-sm">
                        No set of grades over your remaining {r} AU can take you
                        below {fmt(active.min)}.
                      </p>
                    </div>
                  )}
                  {active.status === "out of reach" && (
                    <div className="space-y-1">
                      <p className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                        Out of reach
                      </p>
                      <p className="text-muted-foreground text-sm">
                        It needs more than an A average. Straight As over your
                        remaining {r} AU would finish you on{" "}
                        {fmt(projectedCgpa(c, d, r, 5))}.
                      </p>
                    </div>
                  )}
                </div>

                <hr className="border-foreground/15" />

                <div className="space-y-5">
                  <div className="grid grid-cols-2 items-start gap-4">
                    <div>
                      <p className="text-muted-foreground mb-1.5 text-xs">
                        If you average
                      </p>
                      <p className="text-4xl font-bold tracking-tighter tabular-nums md:text-5xl">
                        {gradeFor(avg)}
                      </p>
                      <p className="text-muted-foreground mt-1.5 text-sm">
                        {avg.toFixed(1)} grade points
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground mb-1.5 text-xs">
                        Projected final CGPA
                      </p>
                      <p className="text-4xl font-bold tracking-tighter tabular-nums md:text-5xl">
                        {fmt(final)}
                      </p>
                      <p className="mt-1.5 flex flex-wrap items-center justify-end gap-2">
                        {final - c > 0.005 && (
                          <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                            +{fmt(final - c)}
                          </span>
                        )}
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-xs font-medium",
                            finalClass
                              ? "bg-background text-primary"
                              : "bg-background text-muted-foreground"
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
                    <div className="relative mx-2 h-6">
                      {SCALE.map(([g, gp]) => (
                        <button
                          key={g}
                          type="button"
                          onClick={() => {
                            setWhatIf(gp)
                            track("what_if_used")
                          }}
                          className={cn(
                            "hover:text-foreground absolute -translate-x-1/2 rounded px-1.5 py-1 text-xs transition-colors",
                            gp === avg
                              ? "text-foreground font-semibold"
                              : "text-muted-foreground"
                          )}
                          style={{ left: pct(gp) }}>
                          {g}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
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
