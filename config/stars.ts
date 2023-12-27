// Default timeslots taken from STARS
export const STARS_TIMESLOTS = [
  { start: 800, end: 830 },
  { start: 830, end: 900 },
  { start: 900, end: 930 },
  { start: 930, end: 1000 },
  { start: 1000, end: 1030 },
  { start: 1030, end: 1100 },
  { start: 1100, end: 1130 },
  { start: 1130, end: 1200 },
  { start: 1200, end: 1230 },
  { start: 1230, end: 1300 },
  { start: 1300, end: 1330 },
  { start: 1330, end: 1400 },
  { start: 1400, end: 1430 },
  { start: 1430, end: 1500 },
  { start: 1500, end: 1530 },
  { start: 1530, end: 1600 },
  { start: 1600, end: 1630 },
  { start: 1630, end: 1700 },
  { start: 1700, end: 1730 },
  { start: 1730, end: 1800 },
  { start: 1800, end: 1830 },
  { start: 1830, end: 1900 },
  { start: 1900, end: 1930 },
  { start: 1930, end: 2000 },
  { start: 2000, end: 2030 },
  { start: 2030, end: 2100 },
  { start: 2100, end: 2130 },
  { start: 2130, end: 2200 },
  { start: 2200, end: 2230 },
  { start: 2230, end: 2300 }
]

export const DAY_MAP: Record<number, string> = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
  6: "Saturday",
  7: "Sunday"
}

export const DAY_TRUN_MAP: Record<number, string> = {
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
  7: "Sun"
}

export const COURSE_TYPE = {
  LEC: "Lecture",
  LAB: "Laboratory",
  SEM: "Seminar",
  TUT: "Tutorial",
  PRJ: "Project",
  DES: "Design"
}
