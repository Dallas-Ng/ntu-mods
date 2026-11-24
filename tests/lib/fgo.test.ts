import { describe, expect, it } from "vitest"

import {
  cgpa,
  NoGradedModulesError,
  NotATranscriptError,
  optimise,
  parseDegreeAuditLines,
  parseTranscriptLines,
  quotaUsage,
  transcriptDiagnostics,
  transcriptErrorProps,
  TranscriptReadError
} from "@/lib/fgo"

const LINES = [
  "2024-2025 SEMESTER 1",
  "CC0007 SCIENCE & TECHNOLOGY FOR HUMANITY 3.0 B",
  "SC2000 PROBABILITY & STATISTICS FOR 3.0 B-",
  "COMPUTING",
  "SC2001 ALGORITHM DESIGN & ANALYSIS 3.0 PASS",
  "BDE1 3.0 EX",
  "2024-2025 SPECIAL TERM",
  "SC3910 PROFESSIONAL ATTACHMENT 5.0 A+",
  "2025-2026 SEMESTER 2",
  "SC3020 DATABASE SYSTEM PRINCIPLES 3.0 C",
  "SC4003 INTELLIGENT AGENTS 3.0 F",
  "SC4079 FINAL YEAR PROJECT 8.0 A-",
  "Cumulative Grade Point Average : 3.10"
]

describe("parseTranscriptLines", () => {
  const { mods, statedCgpa } = parseTranscriptLines(LINES)
  const by = (code: string) => mods.find((m) => m.code === code)!

  it("reads rows, ignores wrapped names, captures stated CGPA", () => {
    expect(mods).toHaveLength(8)
    expect(statedCgpa).toBe(3.1)
    expect(by("SC2000").name).toBe("PROBABILITY & STATISTICS FOR")
  })

  it("classifies statuses and locks FYP / attachments", () => {
    expect(by("SC2001").status).toBe("fgo")
    expect(by("BDE1").status).toBe("other")
    expect(by("SC3910").locked).toBe(true)
    expect(by("SC4079").locked).toBe(true)
    expect(by("SC3020").locked).toBe(false)
  })
})

describe("parseTranscriptLines edge cases", () => {
  it("reads a row where pdf.js merged the name and the AU", () => {
    const { mods } = parseTranscriptLines([
      "2025-2026 SEMESTER 2",
      "SC4012 SOFTWARE SECURITY3.0 PASS"
    ])
    expect(mods).toHaveLength(1)
    expect(mods[0]).toMatchObject({
      name: "SOFTWARE SECURITY",
      au: 3,
      status: "fgo"
    })
  })

  it("keeps digits that belong to the name", () => {
    const { mods } = parseTranscriptLines([
      "2024-2025 SEMESTER 1",
      "MH1810 MATHEMATICS 1 3.0 PASS"
    ])
    expect(mods[0]).toMatchObject({ name: "MATHEMATICS 1", au: 3 })
  })

  it("reads rows that end with a grade-points column", () => {
    const { mods } = parseTranscriptLines([
      "2023-2024 SEMESTER 1",
      "CC0003 ETHICS & CIVICS IN A MULTICULTURAL 2.0 B- 3.00",
      "MH1810 MATHEMATICS 1 3.0 A 5.00"
    ])
    expect(mods).toHaveLength(2)
    expect(mods[0]).toMatchObject({ code: "CC0003", au: 2, grade: "B-", gp: 3 })
    expect(mods[1]).toMatchObject({ name: "MATHEMATICS 1", au: 3, grade: "A" })
  })
})

describe("parseDegreeAuditLines", () => {
  const DA_LINES = [
    "11/24/26, 11:11 PM Degree Audit",
    "Degree Audit",
    "Cumulative Grade Point Average (CGPA) 3.75 FGO Quota (Total AU): 24",
    "Total (Grade Point x AU) for CGPA Computation 75 FGO Exercised (Total AU): 9",
    "Total AU for CGPA Computation 20 FGO Exercised (ICC/Core/MPE cap at 12 AU): 6",
    "Status SATISFACTORY FGO Exercised (BDE): 3",
    "AU Requirements",
    "Legend",
    "GER - General Education Requirement",
    "Examination Results",
    "Academic Year 2025 ,Semester 2 Study Year 4",
    "Course Course AU Grade Course Type Course Group FGO Opt-In",
    "SC4031 INTERNET OF THINGS: COMMUNICATIONS",
    "3 B P",
    "& NETWORKING",
    "SC4079 FINAL YEAR PROJECT 8 A- C",
    "HP1000 INTRODUCTION TO PSYCHOLOGY 3 B+ BDE",
    "Total AU Earned 14",
    "Semester GPA 3.96",
    "CGPA 3.75",
    "Exam Status:- Satisfactory",
    "Academic Year 2024 ,Special Term Study Year 3",
    "Course Course AU Grade Course Type Course Group FGO Opt-In",
    "SC3910 PROFESSIONAL ATTACHMENT 5 A+ C ICC",
    "Total AU Earned 5",
    "CGPA 3.60",
    "Exam Status:- Satisfactory",
    "Academic Year 2024 ,Semester 1 Study Year 2",
    "Course Course Course FGO",
    "Course Grade",
    "AU Type Group Opt-In",
    "SC2001 ALGORITHM DESIGN &",
    "ANALYSIS AND 3 P C Yes",
    "COMPLEXITY",
    "https://wish.wis.ntu.edu.sg/pls/webexe/dars_result_ro.main_display 3/6",
    "11/24/26, 11:11 PM Degree Audit",
    "SC1013 PHYSICS FOR COMPUTING 2 P C",
    "MOOC1 MORAL FOUNDATIONS OF POLITICS 2 P BDE",
    "SC4079 FINAL YEAR PROJECT 8 IP C",
    "BDE1 3 EX BDE",
    "SC1003 INTRO TO 3 D DESIGN",
    "3 B C",
    "FUNDAMENTALS",
    "Total AU Earned 20",
    "Semester GPA 3.50",
    "CGPA 3.50",
    "Exam Status:- Satisfactory",
    "Legend:",
    "EX - Exempted from Course IP - In Progress NR - No Record",
    "Courses Registered",
    "Academic Course Index Course Course FGO",
    "2025 2 SC3020 DATABASE SYSTEM PRINCIPLES 3 10501 P"
  ]

  it("parses wrapped rows, FGO opt-in, BDE flags, chronological order and stops before Courses Registered", () => {
    const parsed = parseDegreeAuditLines(DA_LINES)
    const by = (code: string, status?: string) =>
      parsed.mods.find(
        (m) => m.code === code && (status ? m.status === status : true)
      )!

    expect(parsed.format).toBe("degree_audit")
    expect(parsed.statedCgpa).toBe(3.75)
    expect(parsed.fgoQuota).toBe(24)
    // 3 AU Core FGO is visible (SC2001), 6 AU stated -> 3 AU hidden Core + 3 AU hidden BDE
    expect(parsed.extraFgoUsed).toEqual({ core: 3, bde: 3 })

    // Courses Registered SC3020 must never be parsed.
    expect(parsed.mods.some((m) => m.code === "SC3020")).toBe(false)

    // Semesters sorted oldest to newest.
    expect([...new Set(parsed.mods.map((m) => m.term))]).toEqual([
      "2024-2025 SEMESTER 1",
      "2024-2025 SPECIAL TERM",
      "2025-2026 SEMESTER 2"
    ])

    // 2-line vertically centred wrap
    expect(by("SC4031")).toMatchObject({
      name: "INTERNET OF THINGS: COMMUNICATIONS & NETWORKING",
      au: 3,
      grade: "B",
      gp: 3.5,
      status: "graded",
      locked: false
    })

    // 3-line wrap with metrics on middle line + FGO Opt-In Yes -> fgo
    expect(by("SC2001")).toMatchObject({
      name: "ALGORITHM DESIGN & ANALYSIS AND COMPLEXITY",
      au: 3,
      grade: "PASS",
      status: "fgo"
    })

    // Title containing "3 D DESIGN" must not false-match metrics tail
    expect(by("SC1003")).toMatchObject({
      name: "INTRO TO 3 D DESIGN FUNDAMENTALS",
      au: 3,
      grade: "B",
      status: "graded"
    })

    // Pass/Fail without FGO Opt-In -> other (does not consume FGO quota)
    expect(by("SC1013").status).toBe("other")
    expect(by("MOOC1")).toMatchObject({ status: "other", bde: true })
    expect(by("BDE1")).toMatchObject({ name: "", status: "other", bde: true })

    // BDE graded module pre-flagged
    expect(by("HP1000")).toMatchObject({
      au: 3,
      grade: "B+",
      status: "graded",
      bde: true
    })

    // FYP IP ignored, FYP graded locked, attachment locked
    expect(by("SC4079", "other")).toMatchObject({ grade: "IP", locked: false })
    expect(by("SC4079", "graded")).toMatchObject({ grade: "A-", locked: true })
    expect(by("SC3910")).toMatchObject({ grade: "A+", locked: true })
  })

  it("handles NR rows with FGO Opt-In and falls back to semester CGPA without Page 2 summary", () => {
    const parsed = parseDegreeAuditLines([
      "Examination Results",
      "Academic Year 2025 ,Semester 1 Study Year 2",
      "Course Course AU Grade Course Type Course Group FGO Opt-In",
      "SC2000 PROBABILITY 3 B C",
      "SC2008 COMPUTER NETWORK 3 NR C Yes",
      "Total AU Earned 3",
      "CGPA 3.50",
      "Exam Status:- Satisfactory"
    ])
    expect(parsed.statedCgpa).toBe(3.5)
    expect(parsed.fgoQuota).toBeNull()
    expect(parsed.extraFgoUsed).toBeNull()
    expect(parsed.mods.find((m) => m.code === "SC2008")).toMatchObject({
      grade: "NR",
      status: "fgo",
      au: 3
    })
  })
})

describe("optimise", () => {
  const { mods } = parseTranscriptLines(LINES)
  const ids = (codes: string[]) =>
    new Set(mods.filter((m) => codes.includes(m.code)).map((m) => m.id))

  it("picks every module below the average, never touches locked modules", () => {
    const bde = new Set(mods.map((m) => m.id))
    const pick = optimise(mods, { quota: 24, bde })
    expect(pick).toEqual(ids(["SC4003", "SC3020", "SC2000", "CC0007"]))
    expect(pick.has(mods.find((m) => m.code === "SC4079")!.id)).toBe(false)
    expect(cgpa(mods, pick)).toBeGreaterThan(cgpa(mods))
  })

  it("respects the core sub-cap when nothing is a BDE", () => {
    // 3 AU already FGO'd as core, so only 9 AU of core headroom remain.
    const pick = optimise(mods, { quota: 24, bde: new Set() })
    const au = [...pick].reduce(
      (s, id) => s + mods.find((m) => m.id === id)!.au,
      0
    )
    expect(au).toBeLessThanOrEqual(9)
  })

  it("matches brute force on a tight quota", () => {
    const bde = new Set<string>()
    const quota = 6 // 3 used, so 3 AU free: exactly one module
    const pick = optimise(mods, { quota, bde })
    const best = Math.max(
      ...mods
        .filter((m) => m.status === "graded" && !m.locked)
        .map((m) => cgpa(mods, new Set([m.id])))
    )
    expect(cgpa(mods, pick)).toBeCloseTo(best, 10)
  })
})

describe("earlier FGO use", () => {
  const { mods } = parseTranscriptLines(LINES)
  const none = new Set<string>()

  it("counts Pass modules and hidden No Record AU in the quota", () => {
    expect(quotaUsage(mods, none, none)).toEqual({ total: 3, core: 3 })
    expect(quotaUsage(mods, none, none, { core: 6, bde: 3 })).toEqual({
      total: 12,
      core: 9
    })
  })

  it("leaves no room when the hidden AU fill the quota", () => {
    const pick = optimise(mods, {
      quota: 24,
      bde: new Set(mods.map((m) => m.id)),
      extra: { core: 0, bde: 21 }
    })
    expect(pick.size).toBe(0)
  })

  it("keeps the core cap tight when hidden core AU use it up", () => {
    const pick = optimise(mods, {
      quota: 24,
      bde: none,
      extra: { core: 9, bde: 0 }
    })
    expect(pick.size).toBe(0)
  })
})

describe("transcriptErrorProps", () => {
  const file = {
    size: 1234,
    type: "application/pdf",
    name: "Jane Tan.pdf"
  } as File

  it("reports the failing stage and counts, never the file name", () => {
    const e = new TranscriptReadError("extract_text", new Error("x"), {
      bytes: 1234,
      pages: 3
    })
    const props = transcriptErrorProps(e, file)
    expect(props).toEqual({
      stage: "extract_text",
      bytes: 1234,
      pages: 3,
      file_type: "application/pdf"
    })
    expect(JSON.stringify(props)).not.toContain("Jane")
  })

  it("treats any other error as no_modules", () => {
    expect(transcriptErrorProps(new Error("no modules found"), file)).toEqual({
      stage: "no_modules",
      bytes: 1234,
      file_type: "application/pdf"
    })
  })

  it("exposes expected-error stage and diagnostics without the file name", () => {
    const err = new NotATranscriptError({
      bytes: 1234,
      pages: 2,
      lines: 123,
      markers: []
    })
    const props = transcriptErrorProps(err, file)
    expect(props).toEqual({
      stage: "not_a_transcript",
      bytes: 1234,
      pages: 2,
      lines: 123,
      markers: [],
      file_type: "application/pdf"
    })
    expect(JSON.stringify(props)).not.toContain("Jane")
  })

  it("exposes no_graded_modules stage for NoGradedModulesError", () => {
    const err = new NoGradedModulesError({ bytes: 1234, pages: 1, lines: 20 })
    expect(transcriptErrorProps(err, file)).toEqual({
      stage: "no_graded_modules",
      bytes: 1234,
      pages: 1,
      lines: 20,
      file_type: "application/pdf"
    })
  })
})

describe("transcriptDiagnostics", () => {
  it("captures parser near-misses, char classes and masked line shapes", () => {
    const lines = [
      "AY2025/26 SEM 1",
      "SC1003 INTRO TO COMPUTING 3.0 A",
      "SC1004 LINEAR ALGEBRA 3.0 B+",
      "SC1005 DIGITAL LOGIC B-",
      "2025-2026 SEMESTER 1",
      "SC2001 ALGORITHMS 3.0 PASS",
      "SC2002 OOP 3.0 IP"
    ]
    const parsed = parseTranscriptLines(lines)
    const diag = transcriptDiagnostics(lines, parsed)
    expect(diag).toMatchObject({
      rows_without_term: 2,
      year_lines: 2,
      grade_ending_lines: 1,
      mods_fgo: 1,
      mods_other: 1,
      term_lines: 1,
      non_ascii_chars: 0
    })
    expect(diag.alnum_chars).toBeGreaterThan(0)
    expect(diag.digit_chars).toBeGreaterThan(0)
    expect(diag.max_line_len).toBeGreaterThan(20)
    expect(diag.sample_shapes).toHaveLength(5)
    expect(diag.top_shapes.length).toBeGreaterThan(0)
    expect(diag.top_shapes[0]).toMatch(/^\d+x /)
  })
})
