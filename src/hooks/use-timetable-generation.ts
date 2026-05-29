"use client"

import { useCallback, useState } from "react"
import { useBoundState } from "@/state/bound.state"

import { latestSemester, latestYear } from "@/lib/semesters"
import { generateCombinations } from "@/lib/generate-timetable-combinations"
import { useSeasonIndexes } from "@/hooks/use-season-indexes"
import { useTimetable } from "@/hooks/use-timetable"

export function useTimetableGeneration() {
  const { timetable, timetableIndex, updateTimetable } = useTimetable()
  const { indexes: seasonIndexes } = useSeasonIndexes(latestYear, latestSemester)
  const generationConfig = useBoundState((s) => s.generationConfig)

  const [combinations, setCombinations] = useState<GeneratedCombination[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [truncated, setTruncated] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)

  const moduleKeys = Object.keys(timetable)

  const generate = useCallback(
    (config = generationConfig, maxResults = 30) => {
      if (moduleKeys.length === 0) return
      setIsGenerating(true)
      setTimeout(() => {
        const result = generateCombinations(
          moduleKeys,
          seasonIndexes,
          config,
          maxResults
        )
        setCombinations(result.combinations)
        setTruncated(result.truncated)
        setHasGenerated(true)
        if (result.combinations.length > 0) {
          updateTimetable(result.combinations[0].timetable, timetableIndex)
        }
        setCurrentIdx(0)
        setIsGenerating(false)
      }, 10)
    },
    [
      moduleKeys,
      seasonIndexes,
      generationConfig,
      timetableIndex,
      updateTimetable
    ]
  )

  const navigateTo = useCallback(
    (idx: number) => {
      if (!combinations[idx]) return
      setCurrentIdx(idx)
      updateTimetable(combinations[idx].timetable, timetableIndex)
    },
    [combinations, timetableIndex, updateTimetable]
  )

  const saveToPlan = useCallback(
    (planIndex: number) => {
      if (!combinations[currentIdx]) return
      updateTimetable(combinations[currentIdx].timetable, planIndex)
    },
    [combinations, currentIdx, updateTimetable]
  )

  const reset = useCallback(() => {
    setCombinations([])
    setCurrentIdx(0)
    setTruncated(false)
    setHasGenerated(false)
  }, [])

  return {
    combinations,
    currentIdx,
    isGenerating,
    truncated,
    hasGenerated,
    moduleKeys,
    generate,
    navigateTo,
    saveToPlan,
    reset
  }
}
