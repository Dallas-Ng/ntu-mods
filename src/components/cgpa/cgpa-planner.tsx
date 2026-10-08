"use client"

import { useRef, useState } from "react"
import { Lock, Upload } from "lucide-react"
import posthog from "posthog-js"

import { gradedTotals, planBands, type BandStatus } from "@/lib/cgpa"
import { readTranscriptPdf } from "@/lib/fgo"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const TRANSCRIPT_URL =
  "https://wis.ntu.edu.sg/webexe/owa/request_transcript_und.LoginN?pType=SH"

// Events carry flags only: never grades or AU.
const track = (event: string, props?: Record<string, unknown>) =>
  posthog.capture(`cgpa_${event}`, props)

const STATUS: Record<BandStatus, { text: string; className: string }> = {
  secured: {
    text: "Already secured",
    className: "text-emerald-600 dark:text-emerald-400"
  },
  possible: { text: "Within reach", className: "text-foreground" },
  "out of reach": { text: "Out of reach", className: "text-muted-foreground" }
}

const CgpaPlanner = () => {
  const input = useRef<HTMLInputElement>(null)
  const [cgpa, setCgpa] = useState("")
  const [doneAu, setDoneAu] = useState("")
  const [leftAu, setLeftAu] = useState("")
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
      setCgpa((points / au).toFixed(2))
      setDoneAu(String(au))
      track("transcript_loaded")
    } catch {
      track("upload_failed")
      setError(
        "Could not read that PDF. Use the official transcript from the NTU Self-Help Transcript System, or enter your CGPA by hand."
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

  const field = (
    id: string,
    label: string,
    value: string,
    set: (v: string) => void,
    hint: string,
    step: string
  ) => (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        min={0}
        step={step}
        value={value}
        onChange={(e) => set(e.target.value)}
      />
      <p className="text-muted-foreground text-xs">{hint}</p>
    </div>
  )

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
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

      <div className="space-y-4 rounded-lg border p-4">
        {field("cgpa", "Current CGPA", cgpa, setCgpa, "Out of 5.00", "0.01")}
        {field(
          "done",
          "AU completed (letter-graded)",
          doneAu,
          setDoneAu,
          "Leave out Pass, No Record and exempted AU",
          "0.5"
        )}
        {field(
          "left",
          "AU still to be letter-graded",
          leftAu,
          setLeftAu,
          "Remaining AU you expect to take, minus any you plan to FGO",
          "0.5"
        )}
        <div className="space-y-2 border-t pt-4">
          <Button
            variant="outline"
            className="w-full"
            disabled={busy}
            onClick={() => input.current?.click()}>
            <Upload /> {busy ? "Reading..." : "Fill from transcript PDF"}
          </Button>
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <Lock className="size-3.5 shrink-0" /> Read in your browser. Get it
            from the{" "}
            <a
              href={TRANSCRIPT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline">
              Transcript System
            </a>
            .
          </p>
          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>
      </div>

      <div className="space-y-3">
        {bands.length === 0 ? (
          <p className="text-muted-foreground rounded-lg border border-dashed p-6 text-sm">
            Enter your CGPA, completed AU and remaining AU to see the average
            grade you need for each honours class.
          </p>
        ) : (
          bands.map((b) => (
            <div
              key={b.label}
              className="bg-card flex items-center justify-between gap-4 rounded-lg border p-4">
              <div>
                <p className="text-sm font-medium">{b.label}</p>
                <p className="text-muted-foreground text-xs">
                  CGPA {b.min.toFixed(2)} and above
                </p>
              </div>
              <div className="text-right">
                <p
                  className={cn(
                    "text-sm font-medium",
                    STATUS[b.status].className
                  )}>
                  {STATUS[b.status].text}
                </p>
                {b.status === "possible" && (
                  <p className="text-muted-foreground text-xs">
                    Average {b.required.toFixed(2)} GPA, about {b.grade}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
        {bands.length > 0 && (
          <p className="text-muted-foreground text-xs">
            Assumes every remaining AU is letter-graded. Some programmes set
            their own honours bands, so confirm with your school.
          </p>
        )}
      </div>
    </div>
  )
}

export default CgpaPlanner
