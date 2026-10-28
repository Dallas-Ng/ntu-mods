import { beforeEach, describe, expect, it, vi } from "vitest"

import {
  NoTranscriptTextError,
  readTranscriptPdf,
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

  it("still reports non-empty PDFs with no recognised modules as parse failures", async () => {
    mockPdf([["Unrecognised transcript text"]])
    await expect(readTranscriptPdf(file)).rejects.toMatchObject({
      name: "TranscriptReadError",
      stage: "parse",
      info: { pages: 1, lines: 1 }
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
})
