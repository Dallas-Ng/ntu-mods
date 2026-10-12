"use client"

import { useMemo, useRef, useState } from "react"
import {
  Check,
  Copy,
  FileText,
  FileUp,
  Lock,
  Sparkles,
  Upload
} from "lucide-react"
import posthog from "posthog-js"

import {
  cgpa,
  FGO_CORE_SUBCAP,
  optimise,
  parseTranscriptLines,
  quotaUsage,
  readTranscriptPdf,
  type ExtraUsage,
  type Mod,
  type ParsedTranscript
} from "@/lib/fgo"
import { shareTranscript } from "@/lib/transcript-share"
import { cn } from "@/lib/utils"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Toggle } from "@/components/ui/toggle"
import { ShareCheckbox } from "@/components/tools/share-checkbox"

const TRANSCRIPT_URL =
  "https://wis.ntu.edu.sg/webexe/owa/request_transcript_und.LoginN?pType=SH"

// Events carry counts and flags only: never module codes, names or grades.
const track = (event: string, props?: Record<string, unknown>) =>
  posthog.capture(`fgo_${event}`, props)

const fmt = (n: number) => n.toFixed(2)
const toAu = (v: string) => Math.max(0, Math.round(Number(v) || 0))

const SAMPLE_LINES = [
  "2024-2025 SEMESTER 1",
  "SC2000 PROBABILITY & STATISTICS FOR COMPUTING 3.0 B-",
  "SC2001 ALGORITHM DESIGN & ANALYSIS 3.0 PASS",
  "SC2002 OBJECT ORIENTED DESIGN & PROGRAMMING 3.0 B+",
  "SC2005 OPERATING SYSTEMS 3.0 B-",
  "SC2006 SOFTWARE ENGINEERING 3.0 A-",
  "CC0007 SCIENCE & TECHNOLOGY FOR HUMANITY 3.0 B",
  "2025-2026 SEMESTER 1",
  "SC3010 COMPUTER SECURITY 3.0 D+",
  "SC3040 ADVANCED SOFTWARE ENGINEERING 3.0 B",
  "SC4053 BLOCKCHAIN TECHNOLOGY 3.0 C+",
  "HW0288 ENGINEERING COMMUNICATION 2.0 A+",
  "2025-2026 SEMESTER 2",
  "SC3020 DATABASE SYSTEM PRINCIPLES 3.0 C",
  "SC4003 INTELLIGENT AGENTS 3.0 F",
  "SC4079 FINAL YEAR PROJECT 8.0 A-"
]

export default function FgoOptimiser() {
  const [data, setData] = useState<ParsedTranscript | null>(null)
  const [fileName, setFileName] = useState("")
  const [share, setShare] = useState(true)
  const [quota, setQuota] = useState("24")
  const [bde, setBde] = useState<Set<string>>(new Set())
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [extraCore, setExtraCore] = useState("0")
  const [extraBde, setExtraBde] = useState("0")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const input = useRef<HTMLInputElement>(null)

  const quotaAu = Number(quota)
  const extra: ExtraUsage = { core: toAu(extraCore), bde: toAu(extraBde) }
  const mods = useMemo(
    () => (data?.mods ?? []).filter((m) => m.status !== "other"),
    [data]
  )
  const priorMods = mods.filter((m) => m.status === "fgo")
  const priorAu = priorMods.reduce((s, m) => s + m.au, 0)
  const usage = quotaUsage(mods, picked, bde, extra)
  const baseUsage = quotaUsage(mods, new Set(), bde, extra)
  const pickedMods = mods.filter((m) => picked.has(m.id))

  const current = data ? cgpa(data.mods) : 0
  const projected = data ? cgpa(data.mods, picked) : 0
  const impact = useMemo(() => {
    const out = new Map<string, number>()
    if (!data) return out
    const base = cgpa(data.mods)
    for (const m of data.mods) {
      if (m.status === "graded" && !m.locked && m.au > 0) {
        out.set(m.id, cgpa(data.mods, new Set([m.id])) - base)
      }
    }
    return out
  }, [data])
  const canAdd = (m: Mod) =>
    usage.total + m.au <= quotaAu &&
    (bde.has(m.id) || usage.core + m.au <= FGO_CORE_SUBCAP)

  function loadSample() {
    setData(parseTranscriptLines(SAMPLE_LINES))
    setFileName("Sample transcript")
    setBde(new Set())
    setPicked(new Set())
    setExtraCore("0")
    setExtraBde("0")
    setError("")
    track("sample_loaded")
  }

  async function load(file: File | undefined) {
    if (!file) return
    setBusy(true)
    setError("")
    try {
      const parsed = await readTranscriptPdf(file)
      if (!parsed.mods.some((m) => m.status === "graded")) {
        throw new Error("no modules found")
      }
      setData(parsed)
      setFileName(file.name)
      setBde(new Set())
      setPicked(new Set())
      setExtraCore("0")
      setExtraBde("0")
      if (share) shareTranscript("fgo", parsed.mods)
      track("transcript_loaded", {
        modules: parsed.mods.length,
        graded: parsed.mods.filter((m) => m.status === "graded").length,
        previously_fgo: parsed.mods.filter((m) => m.status === "fgo").length
      })
    } catch {
      track("upload_failed")
      setError(
        "Could not read that PDF. Use the official transcript from the NTU Self-Help Transcript System, or the NIE Academic Progress Report."
      )
    } finally {
      setBusy(false)
    }
  }

  const flip = (set: Set<string>, id: string, on: boolean) => {
    const next = new Set(set)
    if (on) next.add(id)
    else next.delete(id)
    return next
  }

  // Quota, BDE and earlier-use changes can break the caps, so drop the picks
  // rather than guess which ones to keep.
  const resetPicks = () => setPicked(new Set())

  function togglePick(id: string, on: boolean, source: "row" | "checkbox") {
    setPicked(flip(picked, id, on))
    track("module_toggled", {
      selected: on,
      source,
      picks: picked.size + (on ? 1 : -1)
    })
  }

  function autoOptimise() {
    if (!data) return
    const best = optimise(data.mods, { quota: quotaAu, bde, extra })
    setPicked(best)
    track("optimised", {
      picks: best.size,
      quota: quotaAu,
      bde_marked: bde.size,
      extra_used_au: extra.core + extra.bde,
      previously_fgo_au: priorAu,
      gain: Number((cgpa(data.mods, best) - current).toFixed(3))
    })
  }

  async function copyList() {
    const text = pickedMods
      .map((m) => `${m.code} ${m.name} (${m.grade}, ${m.au} AU)`)
      .join("\n")
    try {
      await navigator.clipboard.writeText(text)
      track("list_copied", { picks: pickedMods.length })
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  const fileInput = (
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
  )

  if (!data) {
    return (
      <div className="space-y-8">
        {fileInput}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            void load(e.dataTransfer.files[0])
          }}
          className="flex flex-col items-center gap-6 rounded-xl border-2 border-dashed px-6 py-14 text-center sm:py-16">
          <span className="bg-muted flex size-14 items-center justify-center rounded-full">
            <FileUp className="text-muted-foreground size-6" />
          </span>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold tracking-tight">
              {busy
                ? "Reading your transcript..."
                : "Upload your NTU transcript"}
            </h2>
            <p className="text-muted-foreground mx-auto max-w-md text-sm leading-relaxed">
              Drop the official PDF here, or choose it from your device. NIE
              students can use the Academic Progress Report.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button disabled={busy} onClick={() => input.current?.click()}>
              <Upload /> Choose PDF
            </Button>
            <Button variant="outline" disabled={busy} onClick={loadSample}>
              Try with sample data
            </Button>
          </div>
          <p className="text-muted-foreground flex items-center gap-1.5 text-xs">
            <Lock className="size-3.5" /> Your PDF is read in your browser and
            never uploaded.
          </p>
          <ShareCheckbox checked={share} onChange={setShare} />
          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <ol className="grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "Get your transcript",
              body: (
                <>
                  Download the official PDF from the{" "}
                  <a
                    href={TRANSCRIPT_URL}
                    onClick={() => track("transcript_link_clicked")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 underline">
                    Self-Help Transcript System
                  </a>
                  .
                </>
              )
            },
            {
              title: "Set up your quota",
              body: "Choose 21 or 24 AU, and mark which modules were BDEs. Modules you have already used FGO on are detected for you."
            },
            {
              title: "Pick your modules",
              body: "Run Auto-optimise, or click modules yourself and watch the projected CGPA change."
            }
          ].map((step, i) => (
            <li
              key={step.title}
              className="bg-card space-y-2 rounded-lg border p-4">
              <span className="bg-muted text-muted-foreground flex size-6 items-center justify-center rounded-full text-xs font-semibold">
                {i + 1}
              </span>
              <p className="text-sm font-medium">{step.title}</p>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    )
  }

  const left = Math.max(0, quotaAu - baseUsage.total)
  const gained = picked.size > 0 ? projected - current : 0
  const terms = [...new Set(mods.map((m) => m.term))]

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
      {fileInput}

      {/* Result and quota: first on mobile, sticky on the right on desktop */}
      <aside className="space-y-3 lg:sticky lg:top-20 lg:order-2">
        <div className="space-y-4 rounded-lg border-2 p-4">
          <div>
            <p className="text-muted-foreground text-xs">Projected CGPA</p>
            <p className="flex items-baseline gap-2">
              <span className="text-4xl font-semibold tabular-nums">
                {fmt(projected)}
              </span>
              {gained > 0 && (
                <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  +{fmt(gained)}
                </span>
              )}
            </p>
            <p className="text-muted-foreground text-xs">
              Current {fmt(current)}
              {data.statedCgpa !== null &&
                Math.abs(data.statedCgpa - current) > 0.01 &&
                `, transcript shows ${fmt(data.statedCgpa)}`}
            </p>
          </div>

          <div className="space-y-2.5">
            <Meter
              label="FGO quota"
              used={usage.total}
              max={quotaAu}
              over={usage.total > quotaAu}
            />
            <Meter
              label="Core, ICC and MPE"
              used={usage.core}
              max={FGO_CORE_SUBCAP}
              over={usage.core > FGO_CORE_SUBCAP}
            />
          </div>

          <div className="space-y-2">
            <Button className="w-full" size="sm" onClick={autoOptimise}>
              <Sparkles /> Auto-optimise
            </Button>
            {picked.size > 0 && (
              <Button
                className="w-full"
                size="sm"
                variant="ghost"
                onClick={() => {
                  track("picks_cleared", { picks: picked.size })
                  resetPicks()
                }}>
                Clear {picked.size} {picked.size === 1 ? "pick" : "picks"}
              </Button>
            )}
          </div>

          <div className="space-y-1.5 border-t pt-3">
            <label htmlFor="fgo-quota" className="text-xs font-medium">
              Programme quota
            </label>
            <Select
              value={quota}
              onValueChange={(v) => {
                setQuota(v)
                resetPicks()
                track("quota_changed", { quota: Number(v) })
              }}>
              <SelectTrigger id="fgo-quota" size="sm" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24">
                  24 AU, most 4-year programmes
                </SelectItem>
                <SelectItem value="21">
                  21 AU, 3-year and some other programmes
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              {priorAu} AU already used on this transcript ({priorMods.length}{" "}
              {priorMods.length === 1 ? "module" : "modules"} graded Pass),{" "}
              {left} AU left.
            </p>
          </div>

          <Accordion type="single" collapsible className="-mb-2 border-t">
            <AccordionItem value="extra" className="border-b-0">
              <AccordionTrigger className="py-3 text-xs font-medium">
                Used FGO not on your transcript
                {extra.core + extra.bde > 0 &&
                  ` (${extra.core + extra.bde} AU)`}
              </AccordionTrigger>
              <AccordionContent className="space-y-3">
                <p className="text-muted-foreground text-xs">
                  A module you declared FGO on and then failed becomes No Record
                  and leaves your transcript, but still uses quota. Add those AU
                  here, with any S/U from before the FGO rules.
                </p>
                <div className="flex gap-3">
                  <label className="flex-1 space-y-1 text-xs">
                    Core, ICC, MPE
                    <Input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={extraCore}
                      onChange={(e) => {
                        setExtraCore(e.target.value)
                        resetPicks()
                      }}
                      onBlur={() =>
                        track("extra_used_set", {
                          kind: "core",
                          au: extra.core
                        })
                      }
                      className="h-8"
                    />
                  </label>
                  <label className="flex-1 space-y-1 text-xs">
                    BDE
                    <Input
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={extraBde}
                      onChange={(e) => {
                        setExtraBde(e.target.value)
                        resetPicks()
                      }}
                      onBlur={() =>
                        track("extra_used_set", { kind: "bde", au: extra.bde })
                      }
                      className="h-8"
                    />
                  </label>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        {pickedMods.length > 0 && (
          <div className="overflow-hidden rounded-lg border-2">
            <div className="bg-muted/50 text-muted-foreground flex items-center justify-between border-b px-3 py-1.5 text-xs font-medium tracking-wide uppercase">
              Declare in the FGO portal
              <Button
                variant="ghost"
                size="xs"
                onClick={() => void copyList()}
                className="normal-case">
                {copied ? <Check /> : <Copy />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <ul className="divide-y text-sm">
              {pickedMods.map((m) => (
                <li key={m.id} className="flex items-baseline gap-2 px-3 py-2">
                  <span className="text-muted-foreground font-mono text-xs">
                    {m.code}
                  </span>
                  <span className="min-w-0 flex-1 truncate">{m.name}</span>
                  <span className="font-medium">{m.grade}</span>
                </li>
              ))}
            </ul>
            <p className="text-muted-foreground border-t px-3 py-2 text-xs">
              Declarations are final once submitted. Check the list against the
              official FGO portal first.
            </p>
          </div>
        )}
      </aside>

      <div className="min-w-0 space-y-3 lg:order-1">
        <div className="flex items-center justify-between gap-3">
          <p className="text-muted-foreground flex h-8 min-w-0 items-center gap-2 text-sm">
            <FileText className="size-4 shrink-0" />
            <span className="truncate">
              {fileName} · {letterGraded(mods)} graded modules
            </span>
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              track("transcript_changed")
              input.current?.click()
            }}>
            <Upload /> Change transcript
          </Button>
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}

        <div className="overflow-hidden rounded-lg border-2">
          <div className="bg-muted/50 text-muted-foreground flex items-center gap-3 border-b px-3 py-2 text-xs font-medium tracking-wide uppercase">
            <span className="w-8 shrink-0">FGO</span>
            <span className="flex-1">Module</span>
            <span className="w-12 shrink-0 text-center">Grade</span>
            <span className="w-8 shrink-0 text-center">AU</span>
            <span
              className="hidden w-12 shrink-0 text-right sm:block"
              title="Change in CGPA if only this module is Flexible-Graded">
              Impact
            </span>
            <span className="w-14 shrink-0 text-center">Type</span>
          </div>

          {terms.map((term) => (
            <div key={term}>
              <p className="bg-muted/30 text-muted-foreground border-b px-3 py-1.5 text-xs font-medium">
                {term}
              </p>
              <div className="divide-y border-b last:border-b-0">
                {mods
                  .filter((m) => m.term === term)
                  .map((m) => {
                    const prior = m.status === "fgo"
                    const on = prior || picked.has(m.id)
                    const full = !on && !m.locked && !canAdd(m)
                    const delta = impact.get(m.id)
                    const selectable = !prior && !m.locked && !full
                    return (
                      <div
                        key={m.id}
                        onClick={
                          selectable
                            ? () => togglePick(m.id, !on, "row")
                            : undefined
                        }
                        className={cn(
                          "flex items-center gap-3 px-3 py-2",
                          selectable && "hover:bg-accent/50 cursor-pointer",
                          on && !prior && "bg-primary/5",
                          m.locked && "opacity-60"
                        )}>
                        <div
                          className="w-8 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                          title={
                            full ? "No quota left for this module" : undefined
                          }>
                          <Checkbox
                            aria-label={`FGO ${m.code}`}
                            disabled={prior || m.locked || full}
                            checked={on}
                            onCheckedChange={(c) =>
                              togglePick(m.id, c === true, "checkbox")
                            }
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm">
                            <span className="text-muted-foreground mr-2 font-mono text-xs">
                              {m.code}
                            </span>
                            {m.name}
                          </p>
                          {(prior || m.locked) && (
                            <p className="text-muted-foreground text-xs">
                              {prior
                                ? "Already used FGO"
                                : "Not eligible for FGO"}
                            </p>
                          )}
                        </div>
                        <span className="w-12 shrink-0 text-center text-sm font-medium">
                          {m.grade}
                        </span>
                        <span className="text-muted-foreground w-8 shrink-0 text-center text-xs">
                          {m.au}
                        </span>
                        <span
                          className={cn(
                            "hidden w-12 shrink-0 text-right text-xs tabular-nums sm:block",
                            delta !== undefined && delta > 0.005
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-muted-foreground"
                          )}>
                          {delta === undefined
                            ? ""
                            : `${delta >= 0 ? "+" : ""}${fmt(delta)}`}
                        </span>
                        <Toggle
                          variant="outline"
                          size="sm"
                          disabled={m.locked}
                          pressed={bde.has(m.id)}
                          aria-label={`${m.code} is a BDE`}
                          onClick={(e) => e.stopPropagation()}
                          onPressedChange={(p) => {
                            setBde(flip(bde, m.id, p))
                            resetPicks()
                            track("type_toggled", { type: p ? "bde" : "core" })
                          }}
                          className="h-7 w-14 shrink-0 text-xs">
                          {bde.has(m.id) ? "BDE" : "Core"}
                        </Toggle>
                      </div>
                    )
                  })}
              </div>
            </div>
          ))}
        </div>

        <p className="text-muted-foreground text-xs">
          Set Type to BDE for your Broadening and Deepening Electives, since
          only Core, ICC and MPE count towards the 12 AU cap. This tool does not
          check your minimum letter-graded AU or academic sanctions, and it is
          not official. Confirm against the NTU FGO portal before declaring.
        </p>
      </div>
    </div>
  )
}

const letterGraded = (mods: Mod[]) =>
  mods.filter((m) => m.status === "graded").length

function Meter({
  label,
  used,
  max,
  over
}: {
  label: string
  used: number
  max: number
  over: boolean
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium tabular-nums">
          {used} / {max} AU
        </span>
      </div>
      <div className="bg-muted h-1.5 overflow-hidden rounded-full">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            over ? "bg-destructive" : "bg-primary"
          )}
          style={{ width: `${Math.min(100, (used / max) * 100)}%` }}
        />
      </div>
    </div>
  )
}
