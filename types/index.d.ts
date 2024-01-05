interface Course {
  key: string
  title: string
  au: string
  indexes: Record<string, Index[]>
  prerequisites: string
  remarks: string
}

interface Index {
  key: string
  type: string // lecture, tutorial
  group: string // e.g. tutorial group
  day: number // 1-7 only
  time: string
  venue: string
  remarks: string // pre-reqs, etc
  duration: number // for row span, each unit is 1 hour
}

type CourseIndex = {
  [courseKey: string]: Index[]
}

interface Exam {
  date: string
  day: number
  start_time: string
  end_time: string
  key: string
  name: string
  duration: string // in 30 min block,
}
