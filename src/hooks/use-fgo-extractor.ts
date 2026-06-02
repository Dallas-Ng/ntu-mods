"use client"

import { useCallback, useState } from "react"

import type { ExtractedAudit } from "@/types/fgo"
import { parseNtuDegreeAuditText } from "@/lib/fgo-parser"
import { FGO_EXTRACTION_SYSTEM_PROMPT } from "@/lib/fgo-system-prompt"
import { useWebLLM } from "@/hooks/use-web-llm"

type ExtractionStatus =
  | "idle"
  | "reading"
  | "ocr"
  | "parsing"
  | "llm"
  | "done"
  | "error"

interface ExtractionState {
  status: ExtractionStatus
  progress: number
  statusText: string
  result: ExtractedAudit | null
  error: string | null
}

function extractJsonBlock(text: string): unknown | null {
  const m = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (!m) return null
  try {
    return JSON.parse(m[1].trim())
  } catch {
    return null
  }
}

const EMPTY_AUDIT: ExtractedAudit = {
  studentInfo: {
    name: null,
    matricNumber: null,
    programme: null,
    studyYear: null,
    currentCgpa: null,
    totalGradePoints: null,
    totalCgpaAu: null,
    graduationStatus: null
  },
  fgoQuota: {
    total: null,
    used: null,
    remaining: null,
    coreMpeIccUsed: null,
    coreMpeIccCap: null,
    bdeUsed: null
  },
  graduationConstraints: {
    minLetterGradedAu: null,
    currentLetterGradedAu: null,
    minLetterGradedCoreMpeAu: null,
    currentLetterGradedCoreMpeAu: null
  },
  courses: [],
  extractionWarnings: []
}

async function extractPdfText(file: File): Promise<string> {
  // Dynamic import to avoid SSR
  const pdfjsLib = await import("pdfjs-dist")
  // Use local worker from node_modules to avoid CDN
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString()

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
  const parts: string[] = []

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
    parts.push(pageText)
  }

  return parts.join("\n")
}

async function extractImageText(
  file: File,
  onProgress: (p: number) => void
): Promise<string> {
  const { createWorker, PSM } = await import("tesseract.js")
  const worker = await createWorker("eng", 1, {
    logger: (m: { status: string; progress: number }) => {
      // Only track "recognizing text" phase (0→1). Earlier phases stay at 0.
      if (m.status === "recognizing text") {
        onProgress(Math.round(m.progress * 100))
      }
    }
  })
  // PSM 6 = single uniform block; works well for transcript tables
  await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_BLOCK })
  const {
    data: { text }
  } = await worker.recognize(file)
  await worker.terminate()
  return text
}

export function useFgoExtractor() {
  const [state, setState] = useState<ExtractionState>({
    status: "idle",
    progress: 0,
    statusText: "",
    result: null,
    error: null
  })

  const { chat, isReady: llmReady } = useWebLLM()

  const setStatus = useCallback(
    (status: ExtractionStatus, statusText: string, progress = 0) =>
      setState((s) => ({ ...s, status, statusText, progress })),
    []
  )

  const runLlmExtraction = useCallback(
    async (text: string): Promise<ExtractedAudit> => {
      let accumulated = ""
      await chat(
        [
          { role: "system", content: FGO_EXTRACTION_SYSTEM_PROMPT },
          {
            role: "user",
            content: `Extract from this NTU transcript text:\n\n${text.slice(0, 4000)}`
          }
        ],
        (chunk) => {
          accumulated += chunk
        },
        () => {},
        2048
      )
      const parsed = extractJsonBlock(accumulated)
      if (!parsed || typeof parsed !== "object") {
        return {
          ...EMPTY_AUDIT,
          extractionWarnings: [
            "AI extraction did not return valid JSON. Please review and edit the data manually."
          ]
        }
      }
      // Safely merge parsed fields
      const p = parsed as Record<string, unknown>
      return {
        studentInfo: {
          ...EMPTY_AUDIT.studentInfo,
          ...((p.studentInfo as object) ?? {})
        },
        fgoQuota: {
          ...EMPTY_AUDIT.fgoQuota,
          ...((p.fgoQuota as object) ?? {})
        },
        graduationConstraints: {
          ...EMPTY_AUDIT.graduationConstraints,
          ...((p.graduationConstraints as object) ?? {})
        },
        courses: Array.isArray(p.courses)
          ? (p.courses as ExtractedAudit["courses"])
          : [],
        extractionWarnings: Array.isArray(p.extractionWarnings)
          ? (p.extractionWarnings as string[])
          : []
      }
    },
    [chat]
  )

  const processFile = useCallback(
    async (file: File) => {
      setState({
        status: "reading",
        progress: 10,
        statusText: "Reading file…",
        result: null,
        error: null
      })

      try {
        let rawText = ""

        if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
          setStatus("reading", "Extracting PDF text…", 20)
          rawText = await extractPdfText(file)
        } else if (file.type.startsWith("image/")) {
          setStatus("ocr", "Running OCR on image…", 20)
          rawText = await extractImageText(file, (p) =>
            setState((s) => ({ ...s, progress: 20 + Math.round(p * 0.4) }))
          )
        } else {
          throw new Error("Unsupported file type. Upload a PDF or image.")
        }

        setStatus("parsing", "Parsing transcript…", 65)
        const deterministic = parseNtuDegreeAuditText(rawText)

        // If deterministic found courses, show result immediately (fast path)
        if (deterministic.courses.length > 0) {
          setState({
            status: "done",
            progress: 100,
            statusText:
              "Extraction complete. Review and correct any missing fields below.",
            result: deterministic,
            error: null
          })
          return
        }

        // No courses found — try LLM if available
        if (!llmReady) {
          setState({
            status: "done",
            progress: 100,
            statusText:
              "Automatic parsing found no courses. Load the AI model for better extraction, or enter data manually.",
            result: deterministic,
            error: null
          })
          return
        }

        setStatus("llm", "Running AI extraction…", 70)
        const llmResult = await runLlmExtraction(rawText)

        // Merge: prefer deterministic for structured fields, LLM for gaps
        const merged: ExtractedAudit = {
          studentInfo: {
            ...llmResult.studentInfo,
            ...Object.fromEntries(
              Object.entries(deterministic.studentInfo).filter(
                ([, v]) => v !== null
              )
            )
          },
          fgoQuota: {
            ...llmResult.fgoQuota,
            ...Object.fromEntries(
              Object.entries(deterministic.fgoQuota).filter(
                ([, v]) => v !== null
              )
            )
          },
          graduationConstraints: {
            ...llmResult.graduationConstraints,
            ...Object.fromEntries(
              Object.entries(deterministic.graduationConstraints).filter(
                ([, v]) => v !== null
              )
            )
          },
          courses:
            deterministic.courses.length > 0
              ? deterministic.courses
              : llmResult.courses,
          extractionWarnings: [
            ...deterministic.extractionWarnings,
            ...llmResult.extractionWarnings
          ]
        }

        setState({
          status: "done",
          progress: 100,
          statusText: "AI extraction complete.",
          result: merged,
          error: null
        })
      } catch (e) {
        setState({
          status: "error",
          progress: 0,
          statusText: "",
          result: null,
          error:
            e instanceof Error ? e.message : "Unknown error during extraction."
        })
      }
    },
    [llmReady, runLlmExtraction, setStatus]
  )

  const processText = useCallback(
    async (text: string) => {
      setStatus("parsing", "Parsing text…", 30)
      try {
        const deterministic = parseNtuDegreeAuditText(text)
        const hasEnoughData =
          deterministic.courses.length > 0 &&
          deterministic.studentInfo.currentCgpa !== null

        if (hasEnoughData || !llmReady) {
          setState({
            status: "done",
            progress: 100,
            statusText: "Extraction complete.",
            result: deterministic,
            error: null
          })
          return
        }

        setStatus("llm", "Running AI extraction…", 60)
        const llmResult = await runLlmExtraction(text)
        setState({
          status: "done",
          progress: 100,
          statusText: "AI extraction complete.",
          result: llmResult,
          error: null
        })
      } catch (e) {
        setState({
          status: "error",
          progress: 0,
          statusText: "",
          result: null,
          error: e instanceof Error ? e.message : "Unknown error."
        })
      }
    },
    [llmReady, runLlmExtraction, setStatus]
  )

  const reset = useCallback(() => {
    setState({
      status: "idle",
      progress: 0,
      statusText: "",
      result: null,
      error: null
    })
  }, [])

  return {
    ...state,
    processFile,
    processText,
    reset
  }
}
