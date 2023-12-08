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
  day: string
  time: string
  venue: string
  remarks: string // pre-reqs, etc
  duration: number // for row span, each unit is 1 hour
}
