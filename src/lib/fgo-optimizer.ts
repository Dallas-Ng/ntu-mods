import type {
  Course,
  ExtractedAudit,
  FgoSelection,
  FgoStrategy,
  GpaDragEntry,
  OptimisationResult,
  RiskCheck
} from "@/types/fgo"

export const GRADE_POINT_MAP: Record<string, number> = {
  "A+": 5.0,
  A: 5.0,
  "A-": 4.5,
  "B+": 4.0,
  B: 3.5,
  "B-": 3.0,
  "C+": 2.5,
  C: 2.0,
  "D+": 1.5,
  D: 1.0,
  F: 0.0
}

const BENCHMARK_GPA = 4.0

export function gradeToPoint(grade: string): number | null {
  const g = grade?.trim().toUpperCase()
  if (g in GRADE_POINT_MAP) return GRADE_POINT_MAP[g]
  return null
}

function computeCgpa(gradePoints: number, au: number): number {
  if (au <= 0) return 0
  return Math.round((gradePoints / au) * 100) / 100
}

function isCoreIccMpe(course: Course): boolean {
  return (
    course.courseType === "Core" ||
    course.courseType === "ICC" ||
    course.courseType === "MPE"
  )
}

function buildSelection(
  courses: Course[],
  baseGradePoints: number,
  baseAu: number
): FgoSelection {
  const auConsumed = courses.reduce((s, c) => s + c.au, 0)
  const gpRemoved = courses.reduce((s, c) => s + (c.gradePoint ?? 0) * c.au, 0)
  const newTotalAu = baseAu - auConsumed
  const newGradePoints = baseGradePoints - gpRemoved
  const newCgpa = computeCgpa(newGradePoints, newTotalAu)
  const baseCgpa = computeCgpa(baseGradePoints, baseAu)
  const coreMpeIccAuConsumed = courses
    .filter(isCoreIccMpe)
    .reduce((s, c) => s + c.au, 0)
  const bdeAuConsumed = courses
    .filter((c) => c.courseType === "BDE")
    .reduce((s, c) => s + c.au, 0)

  return {
    courses,
    auConsumed,
    gradePointsRemoved: gpRemoved,
    newTotalAu,
    newGradePoints,
    newCgpa,
    cgpaImprovement: Math.round((newCgpa - baseCgpa) * 1000) / 1000,
    coreMpeIccAuConsumed,
    bdeAuConsumed
  }
}

function isValidSelection(
  selected: Course[],
  audit: ExtractedAudit,
  currentLetterAu: number,
  currentCoreMpeAu: number
): boolean {
  const { fgoQuota, graduationConstraints } = audit

  const auUsed = selected.reduce((s, c) => s + c.au, 0)
  const coreMpeIccUsed = selected
    .filter(isCoreIccMpe)
    .reduce((s, c) => s + c.au, 0)

  const quotaRemaining = (fgoQuota.total ?? 24) - (fgoQuota.used ?? 0)
  const coreCap = fgoQuota.coreMpeIccCap ?? 12

  if (auUsed > quotaRemaining) return false
  if (coreMpeIccUsed > coreCap - (fgoQuota.coreMpeIccUsed ?? 0)) return false

  const minLetterAu = graduationConstraints.minLetterGradedAu ?? 0
  if (currentLetterAu - auUsed < minLetterAu) return false

  const coreMpeSelected = selected
    .filter((c) => c.courseType === "Core" || c.courseType === "MPE")
    .reduce((s, c) => s + c.au, 0)
  const minCoreMpeAu = graduationConstraints.minLetterGradedCoreMpeAu ?? 0
  if (currentCoreMpeAu - coreMpeSelected < minCoreMpeAu) return false

  return true
}

function greedySelect(
  sorted: Course[],
  maxAu: number,
  maxCoreMpeIcc: number,
  currentLetterAu: number,
  minLetterAu: number,
  currentCoreMpeAu: number,
  minCoreMpeAu: number,
  limit?: number
): Course[] {
  const selected: Course[] = []
  let auUsed = 0
  let coreMpeIccUsed = 0

  for (const course of sorted) {
    if (limit !== undefined && selected.length >= limit) break
    const wouldUseCoreIcc = isCoreIccMpe(course) ? course.au : 0
    const wouldUseCoreMpe =
      course.courseType === "Core" || course.courseType === "MPE"
        ? course.au
        : 0

    if (auUsed + course.au > maxAu) continue
    if (coreMpeIccUsed + wouldUseCoreIcc > maxCoreMpeIcc) continue
    if (currentLetterAu - auUsed - course.au < minLetterAu) continue
    if (currentCoreMpeAu - wouldUseCoreMpe < minCoreMpeAu) continue

    selected.push(course)
    auUsed += course.au
    coreMpeIccUsed += wouldUseCoreIcc
  }

  return selected
}

export function computeGpaDrag(courses: Course[]): GpaDragEntry[] {
  return courses
    .filter((c) => c.eligibleForFgo && !c.isFailed && c.gradePoint !== null)
    .map((c) => ({
      course: c,
      drag:
        Math.round((BENCHMARK_GPA - (c.gradePoint ?? 0)) * c.au * 100) / 100,
      rank: 0
    }))
    .filter((e) => e.drag > 0)
    .sort((a, b) => b.drag - a.drag)
    .map((e, i) => ({ ...e, rank: i + 1 }))
}

export function optimise(audit: ExtractedAudit): OptimisationResult {
  const { fgoQuota, graduationConstraints, courses } = audit

  const failedCourses = courses.filter((c) => c.isFailed)
  const fgoAppliedCourses = courses.filter((c) => c.isFgoApplied)
  const eligibleCourses = courses.filter(
    (c) => c.eligibleForFgo && !c.isFailed && !c.isFgoApplied
  )
  const ineligibleCourses = courses.filter(
    (c) => !c.eligibleForFgo && !c.isFailed && !c.isFgoApplied
  )

  // Compute current CGPA from courses (use audit values if available, else compute)
  const gradedCourses = courses.filter(
    (c) => c.gradePoint !== null && !c.isFgoApplied
  )
  const currentGradePoints =
    audit.studentInfo.totalGradePoints ??
    gradedCourses.reduce((s, c) => s + (c.gradePoint ?? 0) * c.au, 0)
  const currentCgpaAu =
    audit.studentInfo.totalCgpaAu ?? gradedCourses.reduce((s, c) => s + c.au, 0)
  const currentCgpa =
    audit.studentInfo.currentCgpa ??
    computeCgpa(currentGradePoints, currentCgpaAu)

  const quotaRemaining = (fgoQuota.total ?? 24) - (fgoQuota.used ?? 0)
  const coreMpeIccCapRemaining =
    (fgoQuota.coreMpeIccCap ?? 12) - (fgoQuota.coreMpeIccUsed ?? 0)

  const currentLetterAu =
    graduationConstraints.currentLetterGradedAu ?? currentCgpaAu
  const minLetterAu = graduationConstraints.minLetterGradedAu ?? 0
  const currentCoreMpeAu =
    graduationConstraints.currentLetterGradedCoreMpeAu ??
    courses
      .filter((c) => c.courseType === "Core" || c.courseType === "MPE")
      .filter((c) => c.gradePoint !== null)
      .reduce((s, c) => s + c.au, 0)
  const minCoreMpeAu = graduationConstraints.minLetterGradedCoreMpeAu ?? 0

  const gpaDragRanking = computeGpaDrag(eligibleCourses)
  const sortedByDrag = gpaDragRanking.map((e) => e.course)

  // Recommended: greedy max CGPA within all constraints
  const recommendedCourses = greedySelect(
    sortedByDrag,
    quotaRemaining,
    coreMpeIccCapRemaining,
    currentLetterAu,
    minLetterAu,
    currentCoreMpeAu,
    minCoreMpeAu
  )

  // Conservative: top 1–2 courses only
  const conservativeCourses = greedySelect(
    sortedByDrag,
    quotaRemaining,
    coreMpeIccCapRemaining,
    currentLetterAu,
    minLetterAu,
    currentCoreMpeAu,
    minCoreMpeAu,
    2
  )

  // Graduation safe: add 6 AU buffer above minimum
  const graduationSafeCourses = greedySelect(
    sortedByDrag,
    quotaRemaining,
    coreMpeIccCapRemaining,
    currentLetterAu,
    minLetterAu + 6,
    currentCoreMpeAu,
    minCoreMpeAu + 3
  )

  const mkStrategy = (
    type: FgoStrategy["type"],
    label: string,
    description: string,
    selected: Course[]
  ): FgoStrategy => ({
    type,
    label,
    description,
    selection: buildSelection(selected, currentGradePoints, currentCgpaAu)
  })

  const strategies: FgoStrategy[] = [
    mkStrategy(
      "recommended",
      "Recommended",
      "Maximises CGPA improvement using all eligible quota within policy constraints.",
      recommendedCourses
    ),
    mkStrategy(
      "conservative",
      "Conservative",
      "Uses minimal quota (top 1–2 modules) for a meaningful CGPA boost.",
      conservativeCourses
    ),
    mkStrategy(
      "maxCgpa",
      "Maximum CGPA",
      "Same as recommended — highest possible CGPA regardless of quota efficiency.",
      recommendedCourses
    ),
    mkStrategy(
      "graduationSafe",
      "Graduation Safe",
      "Optimises CGPA while keeping a 6 AU buffer above minimum letter-graded requirements.",
      graduationSafeCourses
    )
  ]

  // Risk checks
  const recSelection = buildSelection(
    recommendedCourses,
    currentGradePoints,
    currentCgpaAu
  )
  const riskChecks: RiskCheck[] = [
    {
      pass: recSelection.newTotalAu >= minLetterAu,
      label: "Minimum letter-graded AU",
      detail: `${recSelection.newTotalAu} AU remaining ≥ ${minLetterAu} AU required`
    },
    {
      pass:
        currentCoreMpeAu -
          recSelection.courses
            .filter((c) => c.courseType === "Core" || c.courseType === "MPE")
            .reduce((s, c) => s + c.au, 0) >=
        minCoreMpeAu,
      label: "Minimum letter-graded Core + MPE AU",
      detail: `Core/MPE AU after FGO ≥ ${minCoreMpeAu} AU required`
    },
    {
      pass: recSelection.auConsumed <= quotaRemaining,
      label: "FGO quota not exceeded",
      detail: `${recSelection.auConsumed} AU used of ${quotaRemaining} AU remaining`
    },
    {
      pass: recSelection.coreMpeIccAuConsumed <= coreMpeIccCapRemaining,
      label: "Core/ICC/MPE cap respected",
      detail: `${recSelection.coreMpeIccAuConsumed} AU of ${coreMpeIccCapRemaining} AU cap used`
    },
    {
      pass: !recSelection.courses.some((c) => !c.eligibleForFgo),
      label: "No ineligible modules selected",
      detail: "All recommended modules are FGO-eligible"
    },
    {
      pass: !recSelection.courses.some((c) => c.isFailed),
      label: "No failed modules auto-recommended",
      detail: "Failed modules excluded from recommendations"
    }
  ]

  const warnings: string[] = [...audit.extractionWarnings]
  if (audit.studentInfo.currentCgpa === null || audit.fgoQuota.total === null) {
    warnings.push(
      "Some data fields could not be extracted. Recommendations are based on available information."
    )
  }

  return {
    currentCgpa,
    currentGradePoints,
    currentCgpaAu,
    fgoQuotaRemaining: quotaRemaining,
    coreMpeIccCapRemaining,
    gpaDragRanking,
    strategies,
    riskChecks,
    failedCourses,
    fgoAppliedCourses,
    eligibleCourses,
    ineligibleCourses,
    warnings
  }
}
