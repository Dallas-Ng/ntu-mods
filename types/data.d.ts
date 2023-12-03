// {"BA2202": {"code": "BA2202", "title": "MATHEMATICS OF FINANCE*~", "au": "4.0 AU", "indexes":
interface module {
  code: string
  title: string
  au: string
  indexes: index[]
}

// {"00117": [{"type": "SEM", "group": "1", "day": "MON", "time": "0830-1220", "venue": "CR1", "remarks": "", "duration": 7, "title": "MATHEMATICS OF FINANCE*~"}],
interface index {
  type: string
  group: string
  day: string
  time: string
  venue: string
  remarks: string
  duration: number
}
