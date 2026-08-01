import { isCustomCourseKey } from "@/lib/custom-course-colors"

const DEFAULT_TIME_BUDGET_MS = 300

function hhmmToMinutes(hhmm: number): number {
  const h = Math.floor(hhmm / 100)
  const m = hhmm % 100
  return h * 60 + m
}

function minutesToHhmm(minutes: number): number {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h * 100 + m
}

export function timeslotsOverlap(a: Index, b: Index): boolean {
  if (a.day !== b.day) return false
  const { startTime: aStart, endTime: aEnd } = parseTimeNumber(a)
  const { startTime: bStart, endTime: bEnd } = parseTimeNumber(b)
  return (
    (aStart >= bStart && aStart < bEnd) ||
    (aEnd > bStart && aEnd <= bEnd) ||
    (aStart <= bStart && aEnd >= bEnd)
  )
}

function parseTimeNumber(index: Index): { startTime: number; endTime: number } {
  const split = index.time.split("-")
  return { startTime: parseInt(split[0]), endTime: parseInt(split[1]) }
}

function slotStartMinutes(index: Index): number {
  return hhmmToMinutes(parseInt(index.time.split("-")[0]))
}

function slotEndMinutes(index: Index): number {
  return hhmmToMinutes(parseInt(index.time.split("-")[1]))
}

function overlapsTimeslot(
  index: Index,
  ts: { day: number; startTime: number; endTime: number }
): boolean {
  if (index.day !== ts.day) return false
  const iStart = hhmmToMinutes(parseInt(index.time.split("-")[0]))
  const iEnd = hhmmToMinutes(parseInt(index.time.split("-")[1]))
  const tStart = hhmmToMinutes(ts.startTime)
  const tEnd = hhmmToMinutes(ts.endTime)
  return iStart < tEnd && iEnd > tStart
}

/**
 * Custom blocks are commitments the user has already made, not something the
 * generator gets to schedule. They still take part in collision detection, but
 * day-window / lunch / blacklist / spacing rules are about where *classes* may
 * go — applying them to a 7am gym block would just make every combination
 * invalid.
 */
const isSchedulable = (slot: Index) => !slot.isCustom

function violatesHardConstraints(
  slots: Index[],
  config: GenerationConfig
): boolean {
  const dayStartMin = hhmmToMinutes(config.dayStartTime)
  const dayEndMin = hhmmToMinutes(config.dayEndTime)

  for (const slot of slots) {
    if (!isSchedulable(slot)) continue
    if (config.skippableTypes.includes(slot.type)) continue

    const startMin = slotStartMinutes(slot)
    const endMin = slotEndMinutes(slot)

    if (startMin < dayStartMin || endMin > dayEndMin) return true

    for (const bl of config.blacklistedTimeslots) {
      if (overlapsTimeslot(slot, bl)) return true
    }

    for (const lb of config.lunchBreaks) {
      if (overlapsTimeslot(slot, lb)) return true
    }
  }

  return false
}

function violatesCombinationConstraints(
  allSlots: Index[],
  config: GenerationConfig
): boolean {
  const noConsecutiveCheck =
    config.maxConsecutiveSlots <= 0 && config.minGapBetweenClasses <= 0
  const noTypeCheck = (config.avoidBackToBackTypes ?? []).length === 0
  const noDailyHoursCheck = (config.maxDailyHours ?? 0) <= 0

  if (noConsecutiveCheck && noTypeCheck && noDailyHoursCheck) return false

  const byDay: Record<number, Index[]> = {}
  for (const slot of allSlots) {
    if (!isSchedulable(slot)) continue
    if (!byDay[slot.day]) byDay[slot.day] = []
    byDay[slot.day].push(slot)
  }

  for (const slots of Object.values(byDay)) {
    const sorted = [...slots].sort(
      (a, b) => slotStartMinutes(a) - slotStartMinutes(b)
    )

    if (!noDailyHoursCheck) {
      let dailyMinutes = 0
      for (const slot of sorted) {
        if (config.skippableTypes.includes(slot.type)) continue
        dailyMinutes += slotEndMinutes(slot) - slotStartMinutes(slot)
      }
      if (dailyMinutes > config.maxDailyHours * 60) return true
    }

    if (!noConsecutiveCheck || !noTypeCheck) {
      let consecutiveMin =
        slotEndMinutes(sorted[0]) - slotStartMinutes(sorted[0])

      for (let i = 1; i < sorted.length; i++) {
        const prevEnd = slotEndMinutes(sorted[i - 1])
        const curStart = slotStartMinutes(sorted[i])
        const curDuration = slotEndMinutes(sorted[i]) - curStart
        const gap = curStart - prevEnd

        if (gap === 0) {
          consecutiveMin += curDuration
          if (
            config.maxConsecutiveSlots > 0 &&
            consecutiveMin > config.maxConsecutiveSlots * 30
          ) {
            return true
          }
          if (!noTypeCheck) {
            const prevType = sorted[i - 1].type
            const curType = sorted[i].type
            for (const [typeA, typeB] of config.avoidBackToBackTypes) {
              if (
                (prevType === typeA && curType === typeB) ||
                (prevType === typeB && curType === typeA)
              )
                return true
            }
          }
        } else {
          consecutiveMin = curDuration
          if (
            config.minGapBetweenClasses > 0 &&
            gap < config.minGapBetweenClasses * 30
          ) {
            return true
          }
        }
      }
    }
  }

  return false
}

function countFreeDays(slots: Index[]): number {
  const daysWithClass = new Set(slots.map((s) => s.day))
  return 5 - [...daysWithClass].filter((d) => d >= 1 && d <= 5).length
}

function countDaysWithClass(slots: Index[]): number {
  return new Set(
    slots.filter((s) => s.day >= 1 && s.day <= 5).map((s) => s.day)
  ).size
}

function scoreCombination(slots: Index[], config: GenerationConfig): number {
  const weekdaySlots = slots.filter((s) => s.day >= 1 && s.day <= 5)
  const daysUsed = new Set(weekdaySlots.map((s) => s.day))

  const hoursByDay: Record<number, number> = {}
  for (const slot of weekdaySlots) {
    const hours = (slotEndMinutes(slot) - slotStartMinutes(slot)) / 60
    hoursByDay[slot.day] = (hoursByDay[slot.day] ?? 0) + hours
  }

  const hoursArr = Object.values(hoursByDay)
  const mean = hoursArr.length
    ? hoursArr.reduce((a, b) => a + b, 0) / hoursArr.length
    : 0
  const stdDev = hoursArr.length
    ? Math.sqrt(
        hoursArr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) /
          hoursArr.length
      )
    : 0

  const freeDays = 5 - daysUsed.size

  let score =
    config.loadPreference === "compact"
      ? freeDays * 10 + stdDev * 5
      : freeDays * 2 + (10 - stdDev) * 5

  for (const day of config.preferredFreeDays ?? []) {
    if (!daysUsed.has(day)) score += 8
  }

  if ((config.preferredDayOrder ?? "none") !== "none") {
    const totalHours = hoursArr.reduce((a, b) => a + b, 0)
    if (totalHours > 0) {
      let weightedPos = 0
      for (const [dayStr, hours] of Object.entries(hoursByDay)) {
        const day = parseInt(dayStr)
        if (day >= 1 && day <= 5) weightedPos += hours * day
      }
      const normalizedPos = weightedPos / totalHours
      const deviation = normalizedPos - 3
      score +=
        config.preferredDayOrder === "front-load"
          ? Math.max(-5, Math.min(5, -deviation * 5))
          : Math.max(-5, Math.min(5, deviation * 5))
    }
  }

  return score
}

interface GenerationResult {
  combinations: GeneratedCombination[]
  truncated: boolean
  /** Leaves discarded because an earlier result had the same timeslot layout. */
  duplicatesSkipped: number
}

export interface GenerateOptions {
  maxResults?: number
  lockedModules?: string[]
  currentTimetable?: Timetable
  /**
   * Count only distinct timeslot layouts against `maxResults`. Two combinations
   * that put classes in exactly the same slots differ only in index numbers,
   * so without this the result budget gets eaten by look-alikes and the user
   * never sees the layouts further down the search tree.
   */
  uniqueTimeslotsOnly?: boolean
  timeBudgetMs?: number
}

function timeslotShape(slots: Index[]): string {
  return slots
    .map((s) => `${s.day}|${s.time}|${s.type}`)
    .sort()
    .join(",")
}

/**
 * Keep one index per distinct slot shape. NTU modules routinely carry dozens of
 * index numbers sharing the same lecture/tutorial slots; in unique mode those
 * are interchangeable, so exploring one of each shrinks the branching factor
 * enough to reach genuinely different layouts inside the time budget.
 */
function collapseIndexShapes(indexes: Indexes): Indexes {
  const seen = new Set<string>()
  const collapsed: Indexes = {}
  for (const [indexKey, slots] of Object.entries(indexes)) {
    const shape = timeslotShape(slots)
    if (seen.has(shape)) continue
    seen.add(shape)
    collapsed[indexKey] = slots
  }
  return collapsed
}

export interface ConstraintSuggestion {
  label: string
}

export function diagnoseConstraints(
  moduleKeys: string[],
  allIndexes: Record<string, Indexes>,
  config: GenerationConfig
): ConstraintSuggestion[] {
  const suggestions: ConstraintSuggestion[] = []

  const tryRelaxation = (label: string, relaxed: Partial<GenerationConfig>) => {
    const { combinations } = generateCombinations(
      moduleKeys,
      allIndexes,
      { ...config, ...relaxed },
      { maxResults: 1 }
    )
    if (combinations.length > 0) suggestions.push({ label })
  }

  if (config.dayStartTime > 800 || config.dayEndTime < 2200) {
    tryRelaxation("Widen day hours to 08:00–22:00", {
      dayStartTime: 800,
      dayEndTime: 2200
    })
  }
  if (config.maxConsecutiveSlots > 0) {
    tryRelaxation("Remove back-to-back limit", { maxConsecutiveSlots: 0 })
  }
  if (config.minGapBetweenClasses > 0) {
    tryRelaxation("Remove minimum gap requirement", { minGapBetweenClasses: 0 })
  }
  if (config.lunchBreaks.length > 0) {
    tryRelaxation("Remove lunch break blocks", { lunchBreaks: [] })
  }
  if (config.blacklistedTimeslots.length > 0) {
    tryRelaxation("Remove all blocked time slots", { blacklistedTimeslots: [] })
  }
  if ((config.maxDailyHours ?? 0) > 0) {
    tryRelaxation("Remove daily hours limit", { maxDailyHours: 0 })
  }
  if ((config.avoidBackToBackTypes ?? []).length > 0) {
    tryRelaxation("Remove back-to-back type restrictions", {
      avoidBackToBackTypes: []
    })
  }

  const customKeys = moduleKeys.filter(isCustomCourseKey)
  if (customKeys.length > 0) {
    const withoutCustom = moduleKeys.filter((k) => !isCustomCourseKey(k))
    const { combinations } = generateCombinations(
      withoutCustom,
      allIndexes,
      config,
      {
        maxResults: 1
      }
    )
    if (combinations.length > 0) {
      suggestions.push({
        label:
          "Your custom blocks clash with every option — move them, or add another option to them"
      })
    }
  }

  return suggestions
}

export function generateCombinations(
  moduleKeys: string[],
  allIndexes: Record<string, Indexes>,
  config: GenerationConfig,
  options: GenerateOptions = {}
): GenerationResult {
  const {
    maxResults = 50,
    lockedModules,
    currentTimetable,
    uniqueTimeslotsOnly = false,
    timeBudgetMs = DEFAULT_TIME_BUDGET_MS
  } = options

  const results: GeneratedCombination[] = []
  const startTime = performance.now()
  let truncated = false
  let duplicatesSkipped = 0
  const seenSignatures = new Set<string>()
  const collapsedCache: Record<string, Indexes> = {}

  /**
   * Unique mode searches over one index per slot shape; locked modules keep
   * their exact index, so that branch reads `allIndexes` directly.
   */
  function searchableIndexes(moduleKey: string): Indexes | undefined {
    const source = allIndexes[moduleKey]
    if (!source || !uniqueTimeslotsOnly) return source
    collapsedCache[moduleKey] ??= collapseIndexShapes(source)
    return collapsedCache[moduleKey]
  }

  function tryIndex(
    moduleKey: string,
    indexKey: string,
    slots: Index[],
    moduleIdx: number,
    partialTimetable: Timetable,
    chosenSlots: Index[]
  ): void {
    if (violatesHardConstraints(slots, config)) return

    const ignoreTypes = config.collisionIgnoreTypes?.[moduleKey] ?? []
    const collisionSlots =
      ignoreTypes.length > 0
        ? slots.filter((s) => !ignoreTypes.includes(s.type))
        : slots

    for (const newSlot of collisionSlots) {
      for (const existing of chosenSlots) {
        if (timeslotsOverlap(newSlot, existing)) return
      }
    }

    const combined = [...chosenSlots, ...collisionSlots]
    if (violatesCombinationConstraints(combined, config)) return

    backtrack(
      moduleIdx + 1,
      { ...partialTimetable, [moduleKey]: indexKey },
      combined
    )
  }

  function backtrack(
    moduleIdx: number,
    partialTimetable: Timetable,
    chosenSlots: Index[]
  ): void {
    if (performance.now() - startTime > timeBudgetMs) {
      truncated = true
      return
    }

    if (moduleIdx === moduleKeys.length) {
      const fullSlots = moduleKeys.flatMap(
        (mk) => allIndexes[mk]?.[partialTimetable[mk]] ?? []
      )
      const timeslotSignature = timeslotShape(fullSlots)
      if (uniqueTimeslotsOnly) {
        if (seenSignatures.has(timeslotSignature)) {
          duplicatesSkipped++
          return
        }
        seenSignatures.add(timeslotSignature)
      }
      results.push({
        timetable: { ...partialTimetable },
        score: scoreCombination(chosenSlots, config),
        freeDays: countFreeDays(chosenSlots),
        daysWithClass: countDaysWithClass(chosenSlots),
        timeslotSignature
      })
      return
    }

    if (maxResults !== Infinity && results.length >= maxResults) {
      truncated = true
      return
    }

    const moduleKey = moduleKeys[moduleIdx]
    const moduleIndexes = searchableIndexes(moduleKey)
    if (!moduleIndexes) return

    if (lockedModules?.includes(moduleKey)) {
      const lockedIndexKey = currentTimetable?.[moduleKey]
      const slots = lockedIndexKey
        ? allIndexes[moduleKey]?.[lockedIndexKey]
        : undefined
      if (!slots) return
      tryIndex(
        moduleKey,
        lockedIndexKey!,
        slots,
        moduleIdx,
        partialTimetable,
        chosenSlots
      )
      return
    }

    for (const [indexKey, slots] of Object.entries(moduleIndexes)) {
      if (truncated) break
      if (maxResults !== Infinity && results.length >= maxResults) {
        truncated = true
        break
      }
      tryIndex(
        moduleKey,
        indexKey,
        slots,
        moduleIdx,
        partialTimetable,
        chosenSlots
      )
    }
  }

  backtrack(0, {}, [])

  results.sort((a, b) => b.score - a.score)

  return { combinations: results, truncated, duplicatesSkipped }
}

export function diagnoseEmptyResult(
  moduleKeys: string[],
  allIndexes: Record<string, Indexes>,
  config: GenerationConfig
): string {
  for (const mk of moduleKeys) {
    if (isCustomCourseKey(mk)) continue
    if (!allIndexes[mk])
      return `Module ${mk} has no data for the current semester.`
    const hasValid = Object.values(allIndexes[mk]).some(
      (slots) => !violatesHardConstraints(slots, config)
    )
    if (!hasValid)
      return `${mk} has no available slots within your configured hours. Try extending day hours in Settings.`
  }
  return `All combinations have scheduling conflicts. If modules share lecture slots, use "Allow collisions" in Settings.`
}
