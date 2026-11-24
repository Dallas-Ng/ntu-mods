import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  InvalidTranscriptPdfError,
  NoGradedModulesError,
  NoTranscriptTextError,
  NotATranscriptError,
  readTranscriptPdf,
  transcriptErrorProps,
  TranscriptReadError
} from "@/lib/fgo"

const { getDocument } = vi.hoisted(() => ({ getDocument: vi.fn() }))

vi.mock("pdfjs-dist/legacy/build/pdf.mjs", () => ({
  GlobalWorkerOptions: {},
  getDocument
}))
vi.mock("pdfjs-dist/legacy/build/pdf.worker.min.mjs?worker", () => ({
  default: class {}
}))

function mockPdf(pages: string[][]) {
  getDocument.mockReturnValue({
    promise: Promise.resolve({
      numPages: pages.length,
      getPage: async (p: number) => ({
        getViewport: () => ({ width: 600 }),
        streamTextContent: () =>
          new ReadableStream({
            start(controller) {
              controller.enqueue({
                items: pages[p - 1].map((str, row) => ({
                  str,
                  transform: [1, 0, 0, 1, 10, 700 - row * 20]
                }))
              })
              controller.close()
            }
          })
      })
    })
  })
}

const file = {
  size: 349009,
  type: "application/pdf",
  arrayBuffer: async () => new ArrayBuffer(0)
} as File

describe("readTranscriptPdf", () => {
  beforeEach(() => getDocument.mockReset())

  it.each([[[]], [["  "]]])(
    "gives PDFs without selectable text an actionable input error (%j)",
    async (pages) => {
      mockPdf([pages])
      await expect(readTranscriptPdf(file)).rejects.toBeInstanceOf(
        NoTranscriptTextError
      )
      await expect(readTranscriptPdf(file)).rejects.toThrow(
        "Upload the original transcript PDF rather than a scan or photo"
      )
    }
  )

  it("rejects near-empty PDFs as not a transcript without a parse failure", async () => {
    mockPdf([["Unrecognised transcript text"]])
    await expect(readTranscriptPdf(file)).rejects.toBeInstanceOf(
      NotATranscriptError
    )
  })

  it("rejects longer PDFs with no transcript signals as not a transcript with diagnostics", async () => {
    mockPdf([
      [
        "AY2025",
        "SG6501",
        ...Array.from({ length: 8 }, (_, i) => `Unrecognised line ${i}`)
      ]
    ])
    const err = await readTranscriptPdf(file).catch((e) => e)
    expect(err).toBeInstanceOf(NotATranscriptError)
    expect(transcriptErrorProps(err, file)).toMatchObject({
      stage: "not_a_transcript",
      pages: 1,
      lines: 10,
      items: 10,
      empty_pages: 0,
      markers: [],
      unsplit_mods: 0
    })
  })

  it("recovers single-column transcripts whose rows span across pageWidth / 2", async () => {
    getDocument.mockReturnValue({
      promise: Promise.resolve({
        numPages: 1,
        getMetadata: async () => ({
          info: { Producer: "Oracle BI Publisher", Author: "Jane Tan" }
        }),
        getPage: async () => ({
          getViewport: () => ({ width: 600, height: 842 }),
          streamTextContent: () =>
            new ReadableStream({
              start(controller) {
                controller.enqueue({
                  items: [
                    {
                      str: "2025-2026 SEMESTER 1",
                      transform: [1, 0, 0, 1, 40, 700]
                    },
                    {
                      str: "SC1003 COMPUTING",
                      transform: [1, 0, 0, 1, 40, 680]
                    },
                    { str: "3.0 A", transform: [1, 0, 0, 1, 450, 680] }
                  ]
                })
                controller.close()
              }
            })
        })
      })
    })
    await expect(readTranscriptPdf(file)).resolves.toMatchObject({
      mods: [{ code: "SC1003", au: 3, grade: "A" }]
    })
  })

  it("parses browser-printed NTU Degree Audit PDFs including vertically centred wrapped rows", async () => {
    getDocument.mockReturnValue({
      promise: Promise.resolve({
        numPages: 1,
        getMetadata: async () => ({
          info: { Producer: "Skia/PDF m158", Title: "Degree Audit" }
        }),
        getPage: async () => ({
          getViewport: () => ({ width: 595, height: 842 }),
          streamTextContent: () =>
            new ReadableStream({
              start(controller) {
                controller.enqueue({
                  items: [
                    { str: "Degree Audit", transform: [1, 0, 0, 1, 250, 800] },
                    {
                      str: "Cumulative Grade Point Average (CGPA)",
                      transform: [1, 0, 0, 1, 40, 770]
                    },
                    { str: "4.00", transform: [1, 0, 0, 1, 260, 770] },
                    {
                      str: "FGO Quota (Total AU):",
                      transform: [1, 0, 0, 1, 340, 770]
                    },
                    { str: "24", transform: [1, 0, 0, 1, 480, 770] },
                    {
                      str: "Examination Results",
                      transform: [1, 0, 0, 1, 240, 730]
                    },
                    {
                      str: "Academic Year 2025 ,Semester 1",
                      transform: [1, 0, 0, 1, 40, 700]
                    },
                    { str: "Study Year 2", transform: [1, 0, 0, 1, 450, 700] },
                    {
                      str: "SC1015 INTRODUCTION TO DATA SCIENCE &",
                      transform: [1, 0, 0, 1, 40, 670]
                    },
                    { str: "3", transform: [1, 0, 0, 1, 360, 663.5] },
                    { str: "B+", transform: [1, 0, 0, 1, 410, 663.5] },
                    { str: "C", transform: [1, 0, 0, 1, 460, 663.5] },
                    { str: "ICC", transform: [1, 0, 0, 1, 510, 663.5] },
                    {
                      str: "ARTIFICIAL INTELLIGENCE",
                      transform: [1, 0, 0, 1, 40, 657]
                    },
                    {
                      str: "MH1810 MATHEMATICS 1",
                      transform: [1, 0, 0, 1, 40, 635]
                    },
                    { str: "3", transform: [1, 0, 0, 1, 360, 635] },
                    { str: "P", transform: [1, 0, 0, 1, 410, 635] },
                    { str: "C", transform: [1, 0, 0, 1, 460, 635] },
                    { str: "Yes", transform: [1, 0, 0, 1, 540, 635] },
                    {
                      str: "HP1000 PSYCHOLOGY",
                      transform: [1, 0, 0, 1, 40, 610]
                    },
                    { str: "3", transform: [1, 0, 0, 1, 360, 610] },
                    { str: "B+", transform: [1, 0, 0, 1, 410, 610] },
                    { str: "BDE", transform: [1, 0, 0, 1, 460, 610] },
                    {
                      str: "Courses Registered",
                      transform: [1, 0, 0, 1, 240, 560]
                    },
                    {
                      str: "2025 2 SC3020 DATABASES 3 10501 P",
                      transform: [1, 0, 0, 1, 40, 535]
                    }
                  ]
                })
                controller.close()
              }
            })
        })
      })
    })

    const parsed = await readTranscriptPdf(file)
    expect(parsed).toMatchObject({
      format: "degree_audit",
      statedCgpa: 4,
      fgoQuota: 24
    })
    expect(parsed.mods).toHaveLength(3)
    expect(parsed.mods[0]).toMatchObject({
      code: "SC1015",
      name: "INTRODUCTION TO DATA SCIENCE & ARTIFICIAL INTELLIGENCE",
      au: 3,
      grade: "B+",
      status: "graded"
    })
    expect(parsed.mods[1]).toMatchObject({
      code: "MH1810",
      au: 3,
      grade: "PASS",
      status: "fgo"
    })
    expect(parsed.mods[2]).toMatchObject({
      code: "HP1000",
      au: 3,
      grade: "B+",
      status: "graded",
      bde: true
    })
  })

  it("rejects transcripts with only non-graded modules as NoGradedModulesError", async () => {
    mockPdf([
      [
        "NANYANG TECHNOLOGICAL UNIVERSITY",
        "2025-2026 SEMESTER 1",
        "BDE1 3.0 EX",
        "SC1013 PHYSICS FOR COMPUTING 2.0 PASS",
        "SC4079 FINAL YEAR PROJECT 8.0 IP"
      ]
    ])
    const err = await readTranscriptPdf(file).catch((e) => e)
    expect(err).toBeInstanceOf(NoGradedModulesError)
    expect(transcriptErrorProps(err, file)).toMatchObject({
      stage: "no_graded_modules"
    })
  })

  it("rejects a fresh Degree Audit with only Courses Registered as NoGradedModulesError", async () => {
    mockPdf([
      [
        "Degree Audit",
        "Name STUDENT",
        "Matric U2500001A",
        "AU Requirements",
        "Courses Registered",
        "2025 1 SC1003 COMPUTING 3 10001 C"
      ]
    ])
    const err = await readTranscriptPdf(file).catch((e) => e)
    expect(err).toBeInstanceOf(NoGradedModulesError)
    expect(transcriptErrorProps(err, file)).toMatchObject({
      stage: "no_graded_modules"
    })
  })

  it("classifies producer_bucket without leaking raw PDF metadata", async () => {
    getDocument.mockReturnValue({
      promise: Promise.resolve({
        numPages: 1,
        getMetadata: async () => ({
          info: {
            Producer: "Adobe Scan 24.0",
            Title: "Jane Tan Secret Transcript"
          }
        }),
        getPage: async () => ({
          getViewport: () => ({ width: 600, height: 842 }),
          streamTextContent: () =>
            new ReadableStream({
              start(controller) {
                controller.enqueue({
                  items: Array.from({ length: 6 }, (_, row) => ({
                    str: `Line ${row}`,
                    transform: [1, 0, 0, 1, 40, 700 - row * 20]
                  }))
                })
                controller.close()
              }
            })
        })
      })
    })
    const err = await readTranscriptPdf(file).catch((e) => e)
    expect(err).toBeInstanceOf(NotATranscriptError)
    const props = transcriptErrorProps(err, file)
    expect(props).toMatchObject({
      stage: "not_a_transcript",
      producer_bucket: "scanner",
      orientation: "portrait"
    })
    expect(JSON.stringify(props)).not.toContain("Jane")
  })

  it("still reports transcript-like PDFs with no recognised modules as parse failures", async () => {
    mockPdf([
      [
        "NANYANG TECHNOLOGICAL UNIVERSITY",
        "2025-2026 SEMESTER 1",
        ...Array.from({ length: 6 }, (_, i) => `Unrecognised line ${i}`)
      ]
    ])
    await expect(readTranscriptPdf(file)).rejects.toMatchObject({
      name: "TranscriptReadError",
      stage: "parse",
      info: { pages: 1, lines: 8, markers: ["ntu"], term_lines: 1 }
    })
  })

  it("reads a valid transcript even when an earlier page has no text", async () => {
    mockPdf([[], ["2025-2026 SEMESTER 1", "SC1003 COMPUTING 3.0 A"]])
    await expect(readTranscriptPdf(file)).resolves.toMatchObject({
      mods: [{ code: "SC1003", au: 3, grade: "A" }]
    })
  })

  it("keeps PDF loading failures in error tracking", async () => {
    getDocument.mockReturnValue({
      promise: Promise.reject(new Error("Invalid PDF"))
    })
    await expect(readTranscriptPdf(file)).rejects.toBeInstanceOf(
      TranscriptReadError
    )
  })

  it("rejects an image dropped into the upload without loading PDF.js", async () => {
    await expect(
      readTranscriptPdf({ ...file, type: "image/png" } as File)
    ).rejects.toBeInstanceOf(InvalidTranscriptPdfError)
    expect(getDocument).not.toHaveBeenCalled()
  })

  it("reports an invalid PDF as an input error", async () => {
    const error = new Error("Invalid PDF structure.")
    error.name = "InvalidPDFException"
    getDocument.mockReturnValue({ promise: Promise.reject(error) })
    await expect(readTranscriptPdf(file)).rejects.toBeInstanceOf(
      InvalidTranscriptPdfError
    )
  })
})
