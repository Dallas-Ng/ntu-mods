type Timetable = {
  [moduleKey: string]: string
}

type TimetableWithIndex = {
  [moduleKey: string]: Index[]
}

type Indexes = {
  [indexKey: string]: Index[]
}

type ModuleType =
  | "CORE" // All others (core)
  | "GLOAD" // BDE
  | "MLOAD" // Minor
  | "GERP" // General Education
  | "CNY" // CN Yang Scholars
  | "USP" // CN Yang Scholars

type ModuleFaculty =
  | "OTHERS"
  | "ACC" // Accountancy
  | "ADM" // Art, Design & Media
  | "BMS" // Biomedical Sciences
  | "BS" // Biological Sciences
  | "BUS" // Business
  | "CBE" // Chemical & Biomolecular Engineering
  | "CE" // Computer Engineering
  | "CEE" // Civil Engineering
  | "CHEM" // Chemistry and Biological Chemistry
  | "CHIN" // Chinese
  | "CS" // Communication Studies
  | "CSC" // Computer Science
  | "ECON" // Economics
  | "EEE" // Electrical & Electronic Engineering
  | "EESS" // Environmental Earth Systems Science
  | "ELH" // English
  | "HIST" // History
  | "ICC" // Interdisciplinary Collaborative Courses
  | "LMS" // Linguistics & Multilingual Studies
  | "MAT" // Materials Engineering
  | "MATH" // Mathematical Sciences
  | "ME" // Mechanical Engineering
  | "MED" // Medicine
  | "MS" // Maritime Studies
  | "NIE" // National Institute of Education
  | "NTC" // Nanyang Technopreneurship Centre
  | "PHIL" // Philosophy
  | "PHY" // Physics and Applied Physics
  | "PPGA" // Public Policy And Global Affairs
  | "PSY" // Psychology
  | "SOC" // Sociology
  | "SOH" // Humanities
  | "SPS" // Physical and Mathematical Sciences
  | "SSM" // Sport Science And Management
  | "SSS" // Social Science

interface Module {
  code: string
  au: string
  title: string
  description: string
  searchKeys: string[]
  maintainingDept?: string
  notAvailableToAllProgrammeWith?: string
  notAvailableAsPeToProgramme?: string
  prerequisite?: string[][]
  notAvailableToProgramme?: string
  gradeType?: string
  notAvailableAsBdeueToProgramme?: string
  mutuallyExclusiveWith?: string[]
  notAvailableAsCoreToProgramme?: string
  notOffered?: string
}

interface Index {
  key: string
  type: IndexType
  group: string // e.g. tutorial group
  day: number // 1-7 only
  time: string // 0830 - 0930
  venue: string
  remarks: string // pre-reqs, etc
  duration: number // for row span, each unit is 30 minutes
}

type IndexType = "LEC" | "LAB" | "SEM" | "TUT" | "DES" | "PRJ"

interface Exam {
  date: string
  day: number
  start_time: string
  end_time: string
  key: string
  name: string
  duration?: number
}

interface Feedback {
  id: number
  feedback: string
  category: string
  author: string
  created_at: Date
}

type TimetableCreationMode = "default" | "generation" | "ai"

interface LunchBreak {
  day: number
  startTime: number
  endTime: number
}

interface BlacklistedTimeslot {
  day: number
  startTime: number
  endTime: number
}

interface GenerationConfig {
  dayStartTime: number
  dayEndTime: number
  maxConsecutiveSlots: number
  minGapBetweenClasses: number
  lunchBreaks: LunchBreak[]
  loadPreference: "compact" | "spread"
  skippableTypes: IndexType[]
  blacklistedTimeslots: BlacklistedTimeslot[]
  preferredFreeDays: number[]
  maxDailyHours: number
  preferredDayOrder: "front-load" | "back-load" | "none"
  avoidBackToBackTypes: [IndexType, IndexType][]
}

interface GeneratedCombination {
  timetable: Timetable
  score: number
  freeDays: number
  daysWithClass: number
}

interface ChatMessage {
  id: string
  role: "assistant" | "user"
  content: string
}
