// @vitest-environment jsdom
import { act, createElement } from "react"
import { hydrateRoot } from "react-dom/client"
import { renderToString } from "react-dom/server"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import ExamsList, { type ListedExam } from "@/components/exams/exams-list"

const SAMPLE_EXAMS: ListedExam[] = [
  {
    key: "AAE18C",
    name: "EXPLORING THE GRAMMAR OF ENGLISH",
    date: "23 November 2026",
    day: 1,
    start_time: "9.00 am",
    end_time: "11.30 am",
    duration: 5,
    semester: "AY2026 S1",
    hasPage: true
  },
  {
    key: "CH1104",
    name: "MATERIALS AND ENERGY BALANCES",
    date: "23 November 2026",
    day: 1,
    start_time: "9.00 am",
    end_time: "11.30 am",
    duration: 5,
    semester: "AY2026 S1",
    hasPage: false
  },
  {
    key: "CS2008",
    name: "FUNDAMENTALS OF RESEARCH",
    date: "23 November 2026",
    day: 1,
    start_time: "1.00 pm",
    end_time: "3.00 pm",
    duration: 4,
    semester: "AY2026 S1",
    hasPage: true
  },
  {
    key: "AD1101",
    name: "FINANCIAL ACCOUNTING",
    date: "24 November 2026",
    day: 2,
    start_time: "1.00 pm",
    end_time: "3.30 pm",
    duration: 5,
    semester: "AY2026 S1",
    hasPage: true
  }
]

describe("ExamsList hydration", () => {
  beforeEach(() => {
    vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it("hydrates without React #418 even when browser localeCompare and toLocaleDateString disagree with the server", async () => {
    const serverHtml = renderToString(
      createElement(ExamsList, { exams: SAMPLE_EXAMS })
    )

    // Simulate a browser locale (e.g. da-DK / cs-CZ) where localeCompare
    // reorders digraphs and toLocaleDateString returns non-English weekdays.
    vi.spyOn(String.prototype, "localeCompare").mockImplementation(function (
      this: string,
      other: string
    ) {
      return this === other ? 0 : this < other ? 1 : -1
    })
    vi.spyOn(Date.prototype, "toLocaleDateString").mockReturnValue("mandag")

    const container = document.createElement("div")
    container.innerHTML = serverHtml

    const errors: unknown[] = []
    await act(async () => {
      hydrateRoot(
        container,
        createElement(ExamsList, { exams: SAMPLE_EXAMS }),
        {
          onRecoverableError: (error) => errors.push(error)
        }
      )
    })

    expect(errors).toEqual([])
    expect(container.textContent).toContain("Monday")
    expect(container.textContent).not.toContain("mandag")
  })
})
