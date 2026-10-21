// FGO optimiser: parse an NTU transcript's text lines and pick the set of
// modules to Flexible-Grade that maximises CGPA. Pure functions, no DOM, so it
// runs in the browser (transcripts never leave the device) and under vitest.

export const FGO_CORE_SUBCAP = 12

const GRADE_POINTS: Record<string, number> = {
  "A+": 5,
  A: 5,
  "A-": 4.5,
  "B+": 4,
  B: 3.5,
  "B-": 3,
  "C+": 2.5,
  C: 2,
  "D+": 1.5,
  D: 1,
  F: 0
}

// FYP and work attachments cannot be FGO'd per NTU policy.
const LOCKED_NAME_RE =
  /FINAL YEAR PROJECT|HONOURS PROJECT|ATTACHMENT|INTERNSHIP/i

const TERM_RE = /^(\d{4}-\d{4})\s+(SEMESTER\s+\d|SPECIAL TERM(?:\s+\d)?)/i
// pdf.js merges a long name with the AU next to it ("SECURITY3.0"), so the gap
// between name and AU is optional.
// Some transcripts add a grade-points column after the grade ("3.0 B- 3.00"),
// so an optional trailing number is allowed.
const ROW_RE =
  /^\*?\s*([A-Z]{2,5}\d{1,4}[A-Z]?)\s+(?:(.*?)\s*)?(?<!\d)(\d{1,2}\.\d)\s+([A-Z][A-Za-z+-]*)(?:\s+\d{1,2}\.\d{1,2})?$/
const CGPA_RE = /Cumulative Grade Point Average\s*:\s*(\d\.\d+)/i

export type ModStatus =
  /** Letter grade that counts towards CGPA. */
  | "graded"
  /** Already Pass/No Record: uses quota, excluded from CGPA. */
  | "fgo"
  /** EX, TC, IP, etc.: ignored entirely. */
  | "other"

export interface Mod {
  id: string
  code: string
  name: string
  term: string
  au: number
  grade: string
  gp: number
  status: ModStatus
  locked: boolean
}

export interface ParsedTranscript {
  mods: Mod[]
  statedCgpa: number | null
}

export function parseTranscriptLines(lines: string[]): ParsedTranscript {
  const mods: Mod[] = []
  let term = ""
  let statedCgpa: number | null = null

  for (const raw of lines) {
    const line = raw.replace(/\s+/g, " ").trim()
    const cgpa = CGPA_RE.exec(line)
    if (cgpa) statedCgpa = Number(cgpa[1])

    const t = TERM_RE.exec(line)
    if (t) {
      term = `${t[1]} ${t[2].toUpperCase()}`
      continue
    }

    const m = ROW_RE.exec(line)
    if (!m || !term) continue
    const [, code, name = "", au, grade] = m
    const g = grade.toUpperCase()
    const gp = GRADE_POINTS[g]
    const status: ModStatus =
      gp !== undefined ? "graded" : g === "PASS" ? "fgo" : "other"
    const locked = status === "graded" && LOCKED_NAME_RE.test(name)
    mods.push({
      id: `${term}|${code}|${mods.length}`,
      code,
      name,
      term,
      au: Number(au),
      grade: g,
      gp: gp ?? 0,
      status,
      locked
    })
  }
  return { mods, statedCgpa }
}

/** CGPA over letter-graded modules, treating `selected` as Flexible-Graded. */
export function cgpa(mods: Mod[], selected: ReadonlySet<string> = new Set()) {
  let points = 0
  let au = 0
  for (const m of mods) {
    if (m.status !== "graded" || selected.has(m.id)) continue
    points += m.au * m.gp
    au += m.au
  }
  return au > 0 ? points / au : 0
}

export interface ExtraUsage {
  /** Core / ICC / MPE AU already FGO'd but missing from the transcript. */
  core: number
  /** BDE AU already FGO'd but missing from the transcript. */
  bde: number
}

/**
 * Quota used so far: modules already Pass on the transcript, the picks, and
 * `extra` for earlier FGO / S/U that the transcript hides (a No Record module
 * is removed from the external transcript but still used quota).
 */
export function quotaUsage(
  mods: Mod[],
  picked: ReadonlySet<string>,
  bde: ReadonlySet<string>,
  extra: ExtraUsage = { core: 0, bde: 0 }
) {
  let total = extra.core + extra.bde
  let core = extra.core
  for (const m of mods) {
    if (m.status !== "fgo" && !picked.has(m.id)) continue
    total += m.au
    if (!bde.has(m.id)) core += m.au
  }
  return { total, core }
}

/**
 * Best subset of eligible modules to FGO. Maximising a ratio, so Dinkelbach:
 * for a target lambda, a set S reaches lambda iff sum(au * (lambda - gp)) over
 * S is at least lambda*A - P. Solve that as a 2D knapsack (total AU, core AU),
 * move lambda to the result, repeat until it stops improving.
 */
export function optimise(
  mods: Mod[],
  opts: { quota: number; bde: ReadonlySet<string>; extra?: ExtraUsage }
): Set<string> {
  const { quota, bde, extra } = opts
  const used = quotaUsage(mods, new Set(), bde, extra)
  // AU come in halves at most, so scale by 2 to stay on an integer grid.
  const capT = Math.max(0, Math.round((quota - used.total) * 2))
  const capC = Math.max(0, Math.round((FGO_CORE_SUBCAP - used.core) * 2))
  const items = mods.filter(
    (m) => m.status === "graded" && !m.locked && m.au > 0
  )

  let best = new Set<string>()
  let bestCgpa = cgpa(mods)
  let lambda = bestCgpa

  for (let iter = 0; iter < 30; iter++) {
    const picked = knapsack(items, lambda, capT, capC, bde)
    const next = cgpa(mods, picked)
    if (picked.size === 0 || next <= bestCgpa + 1e-12) break
    best = picked
    bestCgpa = next
    lambda = next
  }
  return best
}

function knapsack(
  items: Mod[],
  lambda: number,
  capT: number,
  capC: number,
  bde: ReadonlySet<string>
): Set<string> {
  const w = capC + 1
  const size = (capT + 1) * w
  let dp = new Float64Array(size)
  const take: Uint8Array[] = []

  for (const m of items) {
    const a = Math.round(m.au * 2)
    const c = bde.has(m.id) ? 0 : a
    const v = m.au * (lambda - m.gp)
    const next = dp.slice()
    const took = new Uint8Array(size)
    for (let t = a; t <= capT; t++) {
      for (let k = c; k <= capC; k++) {
        const cand = dp[(t - a) * w + (k - c)] + v
        if (cand > next[t * w + k] + 1e-12) {
          next[t * w + k] = cand
          took[t * w + k] = 1
        }
      }
    }
    dp = next
    take.push(took)
  }

  const out = new Set<string>()
  let t = capT
  let k = capC
  for (let i = items.length - 1; i >= 0; i--) {
    if (!take[i][t * w + k]) continue
    const a = Math.round(items[i].au * 2)
    out.add(items[i].id)
    t -= a
    if (!bde.has(items[i].id)) k -= a
  }
  return out
}

interface TextItem {
  str: string
  x: number
  y: number
}

/** Rebuild reading-order lines from positioned PDF text, one column at a time. */
export function itemsToLines(items: TextItem[], pageWidth: number): string[] {
  const lines: string[] = []
  for (const col of [
    items.filter((i) => i.x < pageWidth / 2),
    items.filter((i) => i.x >= pageWidth / 2)
  ]) {
    const sorted = col
      .filter((i) => i.str.trim())
      .sort((a, b) => b.y - a.y || a.x - b.x)
    let row: TextItem[] = []
    const flush = () => {
      if (row.length)
        lines.push(
          row
            .sort((a, b) => a.x - b.x)
            .map((i) => i.str)
            .join(" ")
        )
      row = []
    }
    for (const it of sorted) {
      if (row.length && Math.abs(row[0].y - it.y) > 2.5) flush()
      row.push(it)
    }
    flush()
  }
  return lines
}

// Where reading a transcript failed, for error reports. Carries counts only,
// never transcript text.
export type TranscriptStage = "load_pdf" | "extract_text" | "parse"
type TranscriptInfo = {
  pages?: number
  lines?: number
  bytes: number
} & Partial<TranscriptDiagnostics>

// Anonymous shape of what was read, to tell "wrong file" from "our parser
// missed a real transcript" when nothing parses. Counts, flags and masked line
// shapes only (letters become A/a, digits 9), never transcript text.
interface TranscriptDiagnostics {
  chars: number
  term_lines: number
  code_lines: number
  has_cgpa_line: boolean
  markers: string[]
  unmatched_shapes: string[]
}

// Fixed phrases printed on NTU's own PDFs: the exam results printout, the
// official transcript (with its validation and guide pages) and their footers.
const MARKERS: [string, RegExp][] = [
  ["ntu", /nanyang technological university/i],
  ["results_title", /examination results/i],
  ["student", /name of student/i],
  ["matric", /matric no/i],
  ["au_earned", /academic units earned/i],
  ["end", /end\s+of\s+(results|transcript)/i],
  ["guide", /transcript guide|grading system/i],
  ["official", /official transcript/i]
]

const CODE_LINE_RE = /^\*?\s*[A-Z]{2,5}\d{1,4}[A-Z]?\b/

export function transcriptDiagnostics(lines: string[]): TranscriptDiagnostics {
  const text = lines.join("\n")
  const shape = (l: string) =>
    l
      .replace(/\s+/g, " ")
      .trim()
      .replace(/[A-Z]/g, "A")
      .replace(/[a-z]/g, "a")
      .replace(/\d/g, "9")
      .replace(/(.)\1+/g, "$1")
      .slice(0, 40)
  const codeLines = lines.filter((l) => CODE_LINE_RE.test(l))
  return {
    chars: text.length,
    term_lines: lines.filter((l) => TERM_RE.test(l.trim())).length,
    code_lines: codeLines.length,
    has_cgpa_line: CGPA_RE.test(text),
    markers: MARKERS.filter(([, re]) => re.test(text)).map(([k]) => k),
    unmatched_shapes: [
      ...new Set(
        codeLines
          .filter((l) => !ROW_RE.test(l.replace(/\s+/g, " ").trim()))
          .map(shape)
      )
    ].slice(0, 3)
  }
}

export class TranscriptReadError extends Error {
  constructor(
    readonly stage: TranscriptStage,
    readonly cause: unknown,
    readonly info: TranscriptInfo
  ) {
    super(
      `Transcript ${stage} failed: ${cause instanceof Error ? cause.message : String(cause)}`
    )
    this.name = "TranscriptReadError"
  }
}

export async function readTranscriptPdf(file: File): Promise<ParsedTranscript> {
  const info: TranscriptInfo = { bytes: file.size }
  let stage: TranscriptStage = "load_pdf"
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs")
    const { default: PdfWorker } =
      await import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?worker")
    pdfjs.GlobalWorkerOptions.workerPort = new PdfWorker()
    const pdf = await pdfjs.getDocument({ data: await file.arrayBuffer() })
      .promise
    info.pages = pdf.numPages
    stage = "extract_text"
    const lines: string[] = []
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p)
      const { width } = page.getViewport({ scale: 1 })
      const content = await page.getTextContent()
      const items = content.items.flatMap((i) =>
        "str" in i ? [{ str: i.str, x: i.transform[4], y: i.transform[5] }] : []
      )
      lines.push(...itemsToLines(items, width))
    }
    info.lines = lines.length
    stage = "parse"
    const parsed = parseTranscriptLines(lines)
    if (!parsed.mods.some((m) => m.status === "graded")) {
      Object.assign(info, transcriptDiagnostics(lines))
      throw new Error("no modules found")
    }
    return parsed
  } catch (e) {
    throw new TranscriptReadError(stage, e, info)
  }
}

// Properties for reportError when a transcript upload fails. File name is
// left out (it often holds the student's name).
export function transcriptErrorProps(e: unknown, file: File) {
  return e instanceof TranscriptReadError
    ? { stage: e.stage, ...e.info, file_type: file.type }
    : { stage: "no_modules", bytes: file.size, file_type: file.type }
}
