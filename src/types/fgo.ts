export type CourseType =
  | "Core"
  | "ICC"
  | "MPE"
  | "BDE"
  | "FYP"
  | "Internship"
  | "Others"

export type Grade =
  | "A+"
  | "A"
  | "A-"
  | "B+"
  | "B"
  | "B-"
  | "C+"
  | "C"
  | "D+"
  | "D"
  | "F"
  | "S"
  | "U"
  | "EX"
  | "IP"
  | "W"
  | string

export interface Course {
  courseCode: string
  courseTitle: string
  au: number
  grade: Grade
  gradePoint: number | null
  courseType: CourseType
  eligibleForFgo: boolean
  eligibilityReason: string
  isFgoApplied: boolean
  isFailed: boolean
  academicYear: string | null
  semester: string | null
}

export interface StudentInfo {
  name: string | null
  matricNumber: string | null
  programme: string | null
  studyYear: string | null
  currentCgpa: number | null
  totalGradePoints: number | null
  totalCgpaAu: number | null
  graduationStatus: string | null
}

export interface FgoQuota {
  total: number | null
  used: number | null
  remaining: number | null
  coreMpeIccUsed: number | null
  coreMpeIccCap: number | null
  bdeUsed: number | null
}

export interface GraduationConstraints {
  minLetterGradedAu: number | null
  currentLetterGradedAu: number | null
  minLetterGradedCoreMpeAu: number | null
  currentLetterGradedCoreMpeAu: number | null
}

export interface ExtractedAudit {
  studentInfo: StudentInfo
  fgoQuota: FgoQuota
  graduationConstraints: GraduationConstraints
  courses: Course[]
  extractionWarnings: string[]
}

export interface GpaDragEntry {
  course: Course
  drag: number
  rank: number
}

export interface FgoSelection {
  courses: Course[]
  auConsumed: number
  gradePointsRemoved: number
  newTotalAu: number
  newGradePoints: number
  newCgpa: number
  cgpaImprovement: number
  coreMpeIccAuConsumed: number
  bdeAuConsumed: number
}

export type StrategyType =
  | "recommended"
  | "conservative"
  | "maxCgpa"
  | "graduationSafe"

export interface FgoStrategy {
  type: StrategyType
  label: string
  description: string
  selection: FgoSelection
}

export interface RiskCheck {
  pass: boolean
  label: string
  detail: string
}

export interface OptimisationResult {
  currentCgpa: number
  currentGradePoints: number
  currentCgpaAu: number
  fgoQuotaRemaining: number
  coreMpeIccCapRemaining: number
  gpaDragRanking: GpaDragEntry[]
  strategies: FgoStrategy[]
  riskChecks: RiskCheck[]
  failedCourses: Course[]
  fgoAppliedCourses: Course[]
  eligibleCourses: Course[]
  ineligibleCourses: Course[]
  warnings: string[]
}

export interface FgoJsonOutput {
  currentCgpa: number
  currentGradePoints: number
  currentCgpaAu: number
  fgoQuotaTotal: number | null
  fgoQuotaUsed: number | null
  fgoQuotaRemaining: number | null
  coreMpeIccCap: number | null
  recommendedCourses: string[]
  alternativeStrategies: {
    type: string
    newCgpa: number
    cgpaImprovement: number
  }[]
  failedCourses: string[]
  warnings: string[]
  newCgpa: number
  cgpaImprovement: number
}
