import { STARS_TIMESLOTS } from "@/lib/constants"

export const TIME_OPTIONS = STARS_TIMESLOTS.filter(
  (t) => t.start >= 700 && t.start <= 2200
).map((t) => {
  const h = Math.floor(t.start / 100)
  const m = t.start % 100
  return {
    value: t.start,
    label: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
  }
})

export const CONSECUTIVE_OPTIONS = [
  { value: 2, label: "1 hour" },
  { value: 3, label: "1.5 hours" },
  { value: 4, label: "2 hours" },
  { value: 6, label: "3 hours" },
  { value: 8, label: "4 hours" },
  { value: 0, label: "No limit" }
]

export const GAP_OPTIONS = [
  { value: 0, label: "None" },
  { value: 1, label: "30 min" },
  { value: 2, label: "1 hour" },
  { value: 3, label: "1.5 hours" },
  { value: 4, label: "2 hours" }
]

export const GENERATION_INDEX_TYPES: IndexType[] = [
  "LEC",
  "TUT",
  "LAB",
  "SEM",
  "DES",
  "PRJ"
]

export const DEFAULT_GENERATION_CONFIG: GenerationConfig = {
  dayStartTime: 800,
  dayEndTime: 2200,
  maxConsecutiveSlots: 0,
  minGapBetweenClasses: 0,
  lunchBreaks: [],
  loadPreference: "spread",
  skippableTypes: [],
  blacklistedTimeslots: [],
  preferredFreeDays: [],
  maxDailyHours: 0,
  preferredDayOrder: "none",
  avoidBackToBackTypes: [],
  collisionIgnoreTypes: {}
}
