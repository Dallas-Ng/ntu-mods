const TIME_BUDGET_MS = 300

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

function violatesHardConstraints(
  slots: Index[],
  config: GenerationConfig
): boolean {
  const dayStartMin = hhmmToMinutes(config.dayStartTime)
  const dayEndMin = hhmmToMinutes(config.dayEndTime)

  for (const slot of slots) {
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
  return new Set(slots.filter((s) => s.day >= 1 && s.day <= 5).map((s) => s.day)).size
}

function scoreCombination(
  slots: Index[],
  config: GenerationConfig
): number {
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
        hoursArr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / hoursArr.length
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
}

export function generateCombinations(
  moduleKeys: string[],
  allIndexes: Record<string, Indexes>,
  config: GenerationConfig,
  maxResults = 50
): GenerationResult {
  const results: GeneratedCombination[] = []
  const startTime = performance.now()
  let truncated = false

  function backtrack(
    moduleIdx: number,
    partialTimetable: Timetable,
    chosenSlots: Index[]
  ): void {
    if (performance.now() - startTime > TIME_BUDGET_MS) {
      truncated = true
      return
    }

    if (moduleIdx === moduleKeys.length) {
      results.push({
        timetable: { ...partialTimetable },
        score: scoreCombination(chosenSlots, config),
        freeDays: countFreeDays(chosenSlots),
        daysWithClass: countDaysWithClass(chosenSlots)
      })
      return
    }

    if (maxResults !== Infinity && results.length >= maxResults) {
      truncated = true
      return
    }

    const moduleKey = moduleKeys[moduleIdx]
    const moduleIndexes = allIndexes[moduleKey]
    if (!moduleIndexes) return

    for (const [indexKey, slots] of Object.entries(moduleIndexes)) {
      if (truncated) break
      if (maxResults !== Infinity && results.length >= maxResults) break

      if (violatesHardConstraints(slots, config)) continue

      let hasConflict = false
      for (const newSlot of slots) {
        for (const existing of chosenSlots) {
          if (timeslotsOverlap(newSlot, existing)) {
            hasConflict = true
            break
          }
        }
        if (hasConflict) break
      }
      if (hasConflict) continue

      const combined = [...chosenSlots, ...slots]
      if (violatesCombinationConstraints(combined, config)) continue

      backtrack(
        moduleIdx + 1,
        { ...partialTimetable, [moduleKey]: indexKey },
        combined
      )
    }
  }

  backtrack(0, {}, [])

  results.sort((a, b) => b.score - a.score)

  return { combinations: results, truncated }
}
