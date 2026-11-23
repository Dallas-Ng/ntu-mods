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

const WHITESPACE_RE = /\s+/g // e.g. "A  B" -> "  "
const UPPERCASE_RE = /[A-Z]/g // e.g. "Ab3" -> "A"
const LOWERCASE_RE = /[a-z]/g // e.g. "Ab3" -> "b"
const DIGIT_RE = /\d/g // e.g. "Ab3" -> "3"
const REPEATED_CHAR_RE = /(.)\1+/g // e.g. "AAA" -> "AAA"

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
    const line = raw.replace(WHITESPACE_RE, " ").trim()
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

function groupColumnLines(col: TextItem[]): string[] {
  const lines: string[] = []
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
  return lines
}

/** Rebuild reading-order lines from positioned PDF text, one column at a time. */
export function itemsToLines(items: TextItem[], pageWidth: number): string[] {
  return [
    ...groupColumnLines(items.filter((i) => i.x < pageWidth / 2)),
    ...groupColumnLines(items.filter((i) => i.x >= pageWidth / 2))
  ]
}

/** Rebuild reading-order lines without a midpoint column split. */
export function itemsToSingleColumnLines(items: TextItem[]): string[] {
  return groupColumnLines(items)
}

type ProducerBucket =
  | "oracle"
  | "itext"
  | "browser"
  | "quartz"
  | "office"
  | "scanner"
  | "pdf_tool"
  | "other"
  | "none"

const PRODUCER_BUCKETS: [Exclude<ProducerBucket, "other" | "none">, RegExp][] =
  [
    ["oracle", /oracle|bi publisher|peoplesoft/i],
    ["itext", /itext/i],
    ["browser", /chrome|chromium|firefox|safari|mozilla|skia|webkit|headless/i],
    ["quartz", /quartz pdfcontext|macos/i],
    ["office", /microsoft|word|excel|powerpoint|libreoffice|google docs/i],
    [
      "scanner",
      /scan|camscanner|adobe scan|abbyy|ocr|tesseract|\bhpj?\b|canon|epson|brother/i
    ],
    [
      "pdf_tool",
      /adobe|acrobat|pdfium|ghostscript|foxit|nitro|ilovepdf|smallpdf|pdfkit|reportlab|pypdf|fpdf|weasyprint|puppeteer/i
    ]
  ]

function classifyProducer(metadata: unknown): ProducerBucket {
  const info =
    metadata && typeof metadata === "object" && "info" in metadata
      ? (metadata as { info?: Record<string, unknown> }).info
      : undefined
  const raw = [info?.Producer, info?.Creator]
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .join(" ")
  if (!raw) return "none"
  return PRODUCER_BUCKETS.find(([, re]) => re.test(raw))?.[0] ?? "other"
}

// Where reading a transcript failed, for error reports. Carries counts only,
// never transcript text.
export type TranscriptStage = "load_pdf" | "extract_text" | "parse"
type TranscriptInfo = {
  pages?: number
  lines?: number
  items?: number
  empty_pages?: number
  orientation?: "portrait" | "landscape" | "mixed"
  producer_bucket?: ProducerBucket
  bytes: number
} & Partial<TranscriptDiagnostics>

// Anonymous shape of what was read, to tell "wrong file" from "our parser
// missed a real transcript" when nothing parses. Counts, flags and masked line
// shapes only (letters become A/a, digits 9), never transcript text.
interface TranscriptDiagnostics {
  chars: number
  alnum_chars: number
  digit_chars: number
  non_ascii_chars: number
  max_line_len: number
  term_lines: number
  code_lines: number
  rows_without_term: number
  year_lines: number
  grade_ending_lines: number
  mods_fgo: number
  mods_other: number
  has_cgpa_line: boolean
  markers: string[]
  unmatched_shapes: string[]
  sample_shapes: string[]
  top_shapes: string[]
  unsplit_mods?: number
  unsplit_term_lines?: number
  unsplit_markers?: string[]
}

// Loose phrases any NTU transcript, results printout or NIE progress report
// tends to carry (other programmes word these differently, so match widely).
const MARKERS: [string, RegExp][] = [
  ["ntu", /nanyang|\bNTU\b|national institute of education/i],
  ["student", /(name\s+of\s+student|student\s+name|\bstudent\b)/i],
  ["matric", /matric/i],
  ["programme", /programme|program\b/i],
  ["results", /transcript|examination\s+results|academic\s+(record|progress)/i],
  ["au", /academic\s+units|\bAUs?\b/i],
  ["grades", /grade\s*point|\bCGPA\b|\bGPA\b/i],
  ["end", /end\s+of\s+(results|transcript|record)/i]
]

// Code-like row start (NTU codes such as SC1003 or HW0288), kept loose.
const CODE_LINE_RE = /^\*?\s*[A-Z]{2,6}\s?\d{3,4}[A-Z]?\b/
const YEAR_RE = /(?:^|\s|AY)20[1-3]\d(?=$|[\s/-])/i
const GRADE_ENDING_RE =
  /\b(?:A\+|A-|A|B\+|B-|B|C\+|C|D\+|D|F|PASS|FAIL|EX|TC|IP|S|U|W|LOA|NR|IC|ABS)(?:\s+\d{1,2}\.\d{1,2})?$/i

export function transcriptDiagnostics(
  lines: string[],
  parsed?: ParsedTranscript
): TranscriptDiagnostics {
  const text = lines.join("\n")
  const shape = (l: string) =>
    l
      .replace(WHITESPACE_RE, " ")
      .trim()
      .replace(UPPERCASE_RE, "A")
      .replace(LOWERCASE_RE, "a")
      .replace(DIGIT_RE, "9")
      .replace(REPEATED_CHAR_RE, "$1")
      .slice(0, 40)

  let seenTerm = false
  let termLines = 0
  let rowsWithoutTerm = 0
  let yearLines = 0
  let gradeEndingLines = 0
  let alnumChars = 0
  let digitChars = 0
  let nonAsciiChars = 0
  let maxLineLen = 0
  const codeLines: string[] = []
  const shapeCounts = new Map<string, number>()
  const sampleShapes: string[] = []
  const sampleSeen = new Set<string>()

  for (const raw of lines) {
    const norm = raw.replace(WHITESPACE_RE, " ").trim()
    if (norm.length > maxLineLen) maxLineLen = norm.length
    for (let i = 0; i < norm.length; i++) {
      const c = norm.charCodeAt(i)
      if (c > 127) {
        nonAsciiChars++
      } else if (c >= 48 && c <= 57) {
        digitChars++
        alnumChars++
      } else if ((c >= 65 && c <= 90) || (c >= 97 && c <= 122)) {
        alnumChars++
      }
    }
    if (CODE_LINE_RE.test(raw)) codeLines.push(raw)
    if (TERM_RE.test(norm)) {
      termLines++
      seenTerm = true
    } else if (!seenTerm && ROW_RE.test(norm)) {
      rowsWithoutTerm++
    }
    if (YEAR_RE.test(norm)) yearLines++
    if (GRADE_ENDING_RE.test(norm) && !ROW_RE.test(norm)) gradeEndingLines++
    if (norm) {
      const s = shape(norm)
      shapeCounts.set(s, (shapeCounts.get(s) ?? 0) + 1)
      if (sampleShapes.length < 5 && !sampleSeen.has(s)) {
        sampleSeen.add(s)
        sampleShapes.push(s)
      }
    }
  }

  const mods = parsed?.mods ?? []
  return {
    chars: text.length,
    alnum_chars: alnumChars,
    digit_chars: digitChars,
    non_ascii_chars: nonAsciiChars,
    max_line_len: maxLineLen,
    term_lines: termLines,
    code_lines: codeLines.length,
    rows_without_term: rowsWithoutTerm,
    year_lines: yearLines,
    grade_ending_lines: gradeEndingLines,
    mods_fgo: mods.filter((m) => m.status === "fgo").length,
    mods_other: mods.filter((m) => m.status === "other").length,
    has_cgpa_line: CGPA_RE.test(text),
    markers: MARKERS.filter(([, re]) => re.test(text)).map(([k]) => k),
    unmatched_shapes: [
      ...new Set(
        codeLines
          .filter((l) => !ROW_RE.test(l.replace(WHITESPACE_RE, " ").trim()))
          .map(shape)
      )
    ].slice(0, 3),
    sample_shapes: sampleShapes,
    top_shapes: [...shapeCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([s, n]) => `${n}x ${s}`)
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

export class NoTranscriptTextError extends Error {
  constructor(readonly info?: TranscriptInfo) {
    super(
      "This PDF has no selectable text. Upload the original transcript PDF rather than a scan or photo."
    )
    this.name = "NoTranscriptTextError"
  }
}

export class InvalidTranscriptPdfError extends Error {
  constructor(readonly info?: TranscriptInfo) {
    super(
      "This file is not a readable PDF. Upload the original transcript PDF."
    )
    this.name = "InvalidTranscriptPdfError"
  }
}

export class NotATranscriptError extends Error {
  constructor(readonly info?: TranscriptInfo) {
    super(
      "This PDF does not look like a transcript. Upload the official transcript PDF."
    )
    this.name = "NotATranscriptError"
  }
}

// Errors caused by the file the user chose, not by a bug. Shown to the user
// as is and not reported.
export function isExpectedTranscriptError(e: unknown) {
  return (
    e instanceof NoTranscriptTextError ||
    e instanceof InvalidTranscriptPdfError ||
    e instanceof NotATranscriptError
  )
}

// A real transcript has dozens of lines; a handful means a different document.
const MIN_TRANSCRIPT_LINES = 5

function looksLikeTranscript(
  parsed: ParsedTranscript,
  diag: TranscriptDiagnostics,
  singleParsed: ParsedTranscript,
  singleDiag: TranscriptDiagnostics
) {
  return (
    parsed.mods.length > 0 ||
    diag.markers.length > 0 ||
    diag.term_lines > 0 ||
    diag.has_cgpa_line ||
    singleParsed.mods.length > 0 ||
    singleDiag.markers.length > 0 ||
    singleDiag.term_lines > 0 ||
    singleDiag.has_cgpa_line
  )
}

export async function readTranscriptPdf(file: File): Promise<ParsedTranscript> {
  if (file.type.startsWith("image/")) {
    throw new InvalidTranscriptPdfError({ bytes: file.size })
  }
  const info: TranscriptInfo = { bytes: file.size }
  let stage: TranscriptStage = "load_pdf"
  try {
    const [pdfjs, { default: PdfWorker }, data] = await Promise.all([
      import("pdfjs-dist/legacy/build/pdf.mjs"),
      import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?worker"),
      file.arrayBuffer()
    ])
    pdfjs.GlobalWorkerOptions.workerPort = new PdfWorker()
    const pdf = await pdfjs.getDocument({ data }).promise
    info.pages = pdf.numPages
    if (typeof pdf.getMetadata === "function") {
      const metadata = await pdf.getMetadata().catch(() => null)
      info.producer_bucket = classifyProducer(metadata)
    }
    stage = "extract_text"
    const lines: string[] = []
    const pagesItems: TextItem[][] = []
    let itemCount = 0
    let emptyPages = 0
    let portraitPages = 0
    let landscapePages = 0
    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p)
      const { width, height } = page.getViewport({ scale: 1 })
      if (typeof height === "number" && height > 0) {
        if (width > height) landscapePages++
        else portraitPages++
      }
      // pdfjs getTextContent does `for await` over a ReadableStream, which
      // Safari lacks ("undefined is not a function"), so drain it by hand.
      const reader = page.streamTextContent().getReader()
      const items: TextItem[] = []
      for (let r = await reader.read(); !r.done; r = await reader.read()) {
        for (const i of r.value.items) {
          if ("str" in i) {
            items.push({ str: i.str, x: i.transform[4], y: i.transform[5] })
            if (i.str.trim()) itemCount++
          }
        }
      }
      pagesItems.push(items)
      const pageLines = itemsToLines(items, width)
      if (pageLines.length === 0) emptyPages++
      lines.push(...pageLines)
    }
    info.lines = lines.length
    info.items = itemCount
    info.empty_pages = emptyPages
    if (portraitPages > 0 || landscapePages > 0) {
      info.orientation =
        portraitPages > 0 && landscapePages > 0
          ? "mixed"
          : landscapePages > 0
            ? "landscape"
            : "portrait"
    }
    if (!lines.some((line) => line.trim())) {
      throw new NoTranscriptTextError(info)
    }
    stage = "parse"
    const parsed = parseTranscriptLines(lines)
    if (!parsed.mods.some((m) => m.status === "graded")) {
      const singleLines = pagesItems.flatMap(itemsToSingleColumnLines)
      const singleParsed = parseTranscriptLines(singleLines)
      if (singleParsed.mods.some((m) => m.status === "graded")) {
        return singleParsed
      }
      const diag = transcriptDiagnostics(lines, parsed)
      const singleDiag = transcriptDiagnostics(singleLines, singleParsed)
      diag.unsplit_mods = singleParsed.mods.length
      diag.unsplit_term_lines = singleDiag.term_lines
      diag.unsplit_markers = singleDiag.markers
      if (
        lines.length < MIN_TRANSCRIPT_LINES ||
        !looksLikeTranscript(parsed, diag, singleParsed, singleDiag)
      ) {
        throw new NotATranscriptError({ ...info, ...diag })
      }
      Object.assign(info, diag)
      throw new Error("no modules found")
    }
    return parsed
  } catch (e) {
    if (e instanceof NoTranscriptTextError || e instanceof NotATranscriptError)
      throw e
    if (
      stage === "load_pdf" &&
      e instanceof Error &&
      e.name === "InvalidPDFException"
    ) {
      throw new InvalidTranscriptPdfError(info)
    }
    throw new TranscriptReadError(stage, e, info)
  }
}

// Properties for reportError / upload_failed when a transcript upload fails.
// File name is left out (it often holds the student's name).
export function transcriptErrorProps(e: unknown, file: File) {
  if (e instanceof TranscriptReadError) {
    return { stage: e.stage, ...e.info, file_type: file.type }
  }
  if (e instanceof NoTranscriptTextError) {
    return {
      stage: "no_text",
      bytes: file.size,
      ...e.info,
      file_type: file.type
    }
  }
  if (e instanceof InvalidTranscriptPdfError) {
    return {
      stage: "invalid_pdf",
      bytes: file.size,
      ...e.info,
      file_type: file.type
    }
  }
  if (e instanceof NotATranscriptError) {
    return {
      stage: "not_a_transcript",
      bytes: file.size,
      ...e.info,
      file_type: file.type
    }
  }
  return { stage: "no_modules", bytes: file.size, file_type: file.type }
}
