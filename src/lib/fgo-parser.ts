import type { Course, CourseType, ExtractedAudit } from "@/types/fgo"

import { gradeToPoint } from "./fgo-optimizer"

// ---------------------------------------------------------------------------
// NTU course type knowledge base
// ---------------------------------------------------------------------------

// ICC courses (Common Core + known programme ICC electives)
const ICC_CODES = new Set([
  "CC0001",
  "CC0002",
  "CC0003",
  "CC0004",
  "CC0005",
  "CC0006",
  "CC0007",
  "CC0008",
  "CC0009",
  "CC0010",
  "CC0011",
  "CC0012",
  "CC0013",
  "CC0014",
  "CC0015",
  "CC0016",
  "CC0017",
  "CC0018",
  "CC0019",
  "CC0020",
  "HW0188",
  "HW0288",
  "HW0388", // Engineering Communication series
  "EG1001",
  "EG2401",
  "EG3401", // Engineers in Society series
  "ML0004", // Career & Innovative Enterprise
  "SC1015", // Intro to Data Science & AI (ICC for CSC)
  "ES0001",
  "ES0002",
  "ES0003"
])

// FYP course codes (8 AU courses that are Final Year Projects)
const FYP_CODES = new Set([
  "SC4079",
  "EE4001",
  "CE4001",
  "CE4002",
  "AAE199",
  "AB4999",
  "ML4999",
  "BU4999"
])

// Professional Internship / Attachment codes
const INTERNSHIP_CODES = new Set([
  "SC3910",
  "EE3901",
  "CE3990",
  "AAE199P",
  "ML3910",
  "AB3910",
  "BU3910",
  "BC3910",
  "CE4099",
  "EE4099"
])

// Non-graded prefixes that should be excluded from CGPA
const NON_GRADED_GRADES = new Set([
  "EX",
  "IP",
  "TC",
  "W",
  "AT",
  "LOA",
  "PASS",
  "P",
  "S",
  "U",
  "ABS",
  "IC",
  "F*"
])

// ---------------------------------------------------------------------------
// Grade point map (canonical)
// ---------------------------------------------------------------------------
const GP_TO_GRADE: Record<string, string> = {
  "5.00": "A",
  "4.50": "A-",
  "4.00": "B+",
  "3.50": "B",
  "3.00": "B-",
  "2.50": "C+",
  "2.00": "C",
  "1.50": "D+",
  "1.00": "D",
  "0.00": "F"
}

// ---------------------------------------------------------------------------
// Course type inference
// ---------------------------------------------------------------------------
function inferCourseType(code: string, au: number): CourseType {
  // BDE placeholder codes
  if (/^BDE\d+$/.test(code)) return "BDE"
  // MOOC / enrichment
  if (/^MOOC\d+$/i.test(code)) return "Others"
  // FYP — either known code or 8 AU "Final Year Project" pattern
  if (FYP_CODES.has(code) || au === 8) return "FYP"
  // Internship
  if (INTERNSHIP_CODES.has(code)) return "Internship"
  // ICC — CC prefix always ICC
  if (/^CC\d{4}$/.test(code) || ICC_CODES.has(code)) return "ICC"
  // Everything else for standard programme codes = Core
  if (/^[A-Z]{2,4}\d{4}$/.test(code)) return "Core"
  return "Others"
}

function isFgoEligible(type: CourseType): {
  eligible: boolean
  reason: string
} {
  switch (type) {
    case "Core":
      return { eligible: true, reason: "Core courses are FGO-eligible." }
    case "ICC":
      return { eligible: true, reason: "ICC courses are FGO-eligible." }
    case "MPE":
      return { eligible: true, reason: "MPE courses are FGO-eligible." }
    case "BDE":
      return { eligible: true, reason: "BDE courses are FGO-eligible." }
    case "FYP":
      return {
        eligible: false,
        reason: "Final Year Projects are excluded from FGO."
      }
    case "Internship":
      return {
        eligible: false,
        reason: "Professional Internship/Attachment is excluded from FGO."
      }
    default:
      return {
        eligible: false,
        reason: "Course type could not be confirmed as FGO-eligible."
      }
  }
}

// ---------------------------------------------------------------------------
// Regex helpers
// ---------------------------------------------------------------------------

// Matches NTU course codes: SC1003, CC0001, HW0288, MOOC1, BDE1, EG1001 …
const CODE_RE = /\b([A-Z]{2,5}\d{1,4}[A-Z]?)\b/g

// Grade string — use lookahead to prevent "B" matching "B+" (+ is non-word so \b fails for B+/C+ etc.)
const GRADE_RE =
  /\b(A\+|A-|A|B\+|B-|B|C\+|C|D\+|D|F|PASS|EX|IP|TC|W|AT|LOA)(?=[^+\-A-Za-z]|$)/g

// AU: single decimal like "3.0" — exactly one decimal place, range 1–12
const AU_RE = /\b(\d+)\.0\b/g

// Valid NTU grade points only (filters out CGPA, percentages, etc.)
const VALID_GPS = new Set([
  "5.00",
  "4.50",
  "4.00",
  "3.50",
  "3.00",
  "2.50",
  "2.00",
  "1.50",
  "1.00",
  "0.00"
])
const GP_RE = /\b([0-5]\.\d{2})\b/g

// Semester header
const SEM_RE =
  /(\d{4}-\d{4})\s+SEMESTER\s+(\d+)|(\d{4}-\d{4})\s+SPECIAL\s+TERM/gi

// Words to skip when harvesting codes
const NON_CODE_WORDS = new Set([
  "PAGE",
  "CODE",
  "PASS",
  "FAIL",
  "GRADE",
  "POINT",
  "COURSE",
  "AUDIT",
  "WORLD",
  "UNIVERSITY",
  "TECHNOLOGY",
  "SEMESTER",
  "SPECIAL",
  "TERM",
  "RESULTS",
  "EXAMINATION",
  "PROGRAMME",
  "COMPUTING",
  "SCIENCE",
  "ENGINEERING"
])

// ---------------------------------------------------------------------------
// Main parser — handles NTU self-help transcript PDF text
// ---------------------------------------------------------------------------
export function parseNtuDegreeAuditText(text: string): ExtractedAudit {
  const warnings: string[] = []

  // ── Student header info ────────────────────────────────────────────────────
  let name: string | null = null
  let matricNumber: string | null = null
  let programme: string | null = null
  let currentCgpa: number | null = null
  let totalCgpaAu: number | null = null

  const nameMatch = text.match(/NAME OF STUDENT\s*:?\s*([A-Z][A-Z\s]+?)\s*:/i)
  if (nameMatch) name = nameMatch[1].trim()

  const matricMatch = text.match(/\b(U\d{7}[A-Z])\b/)
  if (matricMatch) matricNumber = matricMatch[1]

  const progMatch = text.match(
    /PROGRAMME\s*:?\s*([A-Z][A-Z\s&(),-]+?)(?:\n|$)/im
  )
  if (progMatch) programme = progMatch[1].trim()

  const cgpaMatch = text.match(
    /Cumulative Grade Point Average\s*:?\s*([\d.]+)/i
  )
  if (cgpaMatch) currentCgpa = parseFloat(cgpaMatch[1])

  const auMatch = text.match(/TOTAL ACADEMIC UNITS EARNED\s*:?\s*(\d+)/i)
  if (auMatch) totalCgpaAu = parseInt(auMatch[1])

  // ── Build course list ──────────────────────────────────────────────────────
  // Strategy: The NTU transcript PDF extracts columns separately.
  // Codes, AUs, and grades appear in the same sequential order but as separate
  // runs of text. We collect all three lists and zip them.

  const allCodes: string[] = []
  {
    let m: RegExpExecArray | null
    CODE_RE.lastIndex = 0
    while ((m = CODE_RE.exec(text)) !== null) {
      const c = m[1]
      if (NON_CODE_WORDS.has(c)) continue
      // Skip single-segment things that look like abbreviations (< 5 chars all caps, no digits)
      if (/^[A-Z]{2,5}$/.test(c)) continue
      allCodes.push(c)
    }
  }

  // Extract valid NTU grade points only (filters out CGPA like 3.35, etc.)
  const allGradePoints: (number | null)[] = []
  {
    let m: RegExpExecArray | null
    GP_RE.lastIndex = 0
    while ((m = GP_RE.exec(text)) !== null) {
      if (VALID_GPS.has(m[1])) allGradePoints.push(parseFloat(m[1]))
    }
  }

  // Extract letter grades in order
  const allGrades: string[] = []
  {
    let m: RegExpExecArray | null
    GRADE_RE.lastIndex = 0
    while ((m = GRADE_RE.exec(text)) !== null) {
      allGrades.push(m[1])
    }
  }

  // Extract AUs: only X.0 patterns (AU is always whole number with .0 suffix in NTU transcripts)
  const allAus: number[] = []
  {
    let m: RegExpExecArray | null
    AU_RE.lastIndex = 0
    while ((m = AU_RE.exec(text)) !== null) {
      const v = parseInt(m[1])
      // Valid AU range: 1–12
      if (v >= 1 && v <= 12) allAus.push(v)
    }
  }

  // ── Semester context extraction ────────────────────────────────────────────
  // Build a map of code → {ay, semester} from semester header positions
  const semesterMap = new Map<string, { ay: string; sem: string }>()
  {
    const semHeaders: { index: number; ay: string; sem: string }[] = []
    let m: RegExpExecArray | null
    SEM_RE.lastIndex = 0
    while ((m = SEM_RE.exec(text)) !== null) {
      if (m[1]) {
        semHeaders.push({ index: m.index, ay: m[1], sem: m[2] })
      } else {
        semHeaders.push({ index: m.index, ay: m[3], sem: "ST" })
      }
    }

    // For each code, find which semester it's closest to (before it in text)
    let codeSearchIdx = 0
    CODE_RE.lastIndex = 0
    let mc: RegExpExecArray | null
    while ((mc = CODE_RE.exec(text)) !== null) {
      const c = mc[1]
      if (NON_CODE_WORDS.has(c) || /^[A-Z]{2,5}$/.test(c)) continue
      const pos = mc.index
      // Find the last semester header before this position
      let activeSem = semHeaders[0]
      for (const sh of semHeaders) {
        if (sh.index <= pos) activeSem = sh
        else break
      }
      if (activeSem)
        semesterMap.set(`${c}:${codeSearchIdx}`, {
          ay: activeSem.ay,
          sem: activeSem.sem
        })
      codeSearchIdx++
    }
  }

  // ── Pair codes with grades and AUs ────────────────────────────────────────
  // The grade list may include extra entries (column headers "Grade" repeated,
  // semester labels containing grade-like tokens, etc.)
  // We use grade points as the primary signal: count of grade points should
  // equal count of letter-graded courses.

  // For non-graded courses (EX, IP, TC, PASS), there is no grade point entry.
  // We need to detect these from the grades list.

  // Build a merged sequence:
  // Walk through allGrades. For each non-graded grade, emit (null gradePoint).
  // For each letter grade, consume one gradePoint from allGradePoints.

  const LETTER_GRADES = new Set([
    "A+",
    "A",
    "A-",
    "B+",
    "B",
    "B-",
    "C+",
    "C",
    "D+",
    "D",
    "F"
  ])

  const pairedGrades: { grade: string; gradePoint: number | null }[] = []
  let gpIdx = 0

  for (const g of allGrades) {
    if (LETTER_GRADES.has(g)) {
      const gp = allGradePoints[gpIdx] ?? null
      gpIdx++
      pairedGrades.push({ grade: g, gradePoint: gp })
    } else {
      // Non-graded: EX, IP, TC, PASS, W, etc.
      pairedGrades.push({ grade: g, gradePoint: null })
    }
  }

  // Now zip: codes[i] → allAus[i] → pairedGrades[i]
  const n = Math.min(allCodes.length, allAus.length, pairedGrades.length)

  if (n === 0) {
    warnings.push(
      "Could not extract courses automatically. Please enter courses manually or use AI extraction."
    )
  }

  const courses: Course[] = []
  for (let i = 0; i < n; i++) {
    const courseCode = allCodes[i]
    const au = allAus[i]
    const { grade, gradePoint } = pairedGrades[i]

    const isNonGraded = NON_GRADED_GRADES.has(grade.toUpperCase())
    const isFailed = grade.toUpperCase() === "F"
    // FGO-applied: grade is "PASS" and was converted (check context)
    const isFgoApplied = grade.toUpperCase() === "PASS"

    const courseType = inferCourseType(courseCode, au)
    const { eligible, reason } = isFgoEligible(courseType)

    const semKey = `${courseCode}:${i}`
    const sem = semesterMap.get(semKey)

    courses.push({
      courseCode,
      courseTitle: courseCode, // title not available from column extraction
      au,
      grade,
      gradePoint: isNonGraded ? null : gradePoint,
      courseType,
      eligibleForFgo: eligible,
      eligibilityReason: reason,
      isFgoApplied,
      isFailed,
      academicYear: sem?.ay ?? null,
      semester: sem?.sem ?? null
    })
  }

  // Compute CGPA from courses if not found in header
  const gradedCourses = courses.filter(
    (c) => c.gradePoint !== null && !c.isFgoApplied
  )
  const computedGp = gradedCourses.reduce(
    (s, c) => s + (c.gradePoint ?? 0) * c.au,
    0
  )
  const computedAu = gradedCourses.reduce((s, c) => s + c.au, 0)
  const computedCgpa =
    computedAu > 0 ? Math.round((computedGp / computedAu) * 100) / 100 : null

  return {
    studentInfo: {
      name,
      matricNumber,
      programme,
      studyYear: null,
      currentCgpa: currentCgpa ?? computedCgpa,
      totalGradePoints:
        computedGp > 0 ? Math.round(computedGp * 100) / 100 : null,
      totalCgpaAu: totalCgpaAu ?? (computedAu > 0 ? computedAu : null),
      graduationStatus: null
    },
    fgoQuota: {
      total: null,
      used: null,
      remaining: null,
      coreMpeIccUsed: null,
      coreMpeIccCap: 12, // default NTU cap
      bdeUsed: null
    },
    graduationConstraints: {
      minLetterGradedAu: null,
      currentLetterGradedAu: null,
      minLetterGradedCoreMpeAu: null,
      currentLetterGradedCoreMpeAu: null
    },
    courses,
    extractionWarnings: warnings
  }
}

// Merge two partial extractions
export function mergeExtractions(
  base: ExtractedAudit,
  patch: Partial<ExtractedAudit>
): ExtractedAudit {
  return {
    studentInfo: { ...base.studentInfo, ...patch.studentInfo },
    fgoQuota: { ...base.fgoQuota, ...patch.fgoQuota },
    graduationConstraints: {
      ...base.graduationConstraints,
      ...patch.graduationConstraints
    },
    courses:
      patch.courses && patch.courses.length > 0 ? patch.courses : base.courses,
    extractionWarnings: [
      ...base.extractionWarnings,
      ...(patch.extractionWarnings ?? [])
    ]
  }
}
