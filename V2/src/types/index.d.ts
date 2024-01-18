type Timetable = {
  [moduleKey: string]: string
}

type TimetableWithIndex = {
  [moduleKey: string]: Index[]
}

type Indexes = {
  [indexKey: string]: Index[]
}

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
}
