"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { useBoundState } from "@/state/bound.state"

import { track } from "@/lib/analytics"
import {
  customCourseIdFromKey,
  customCourseModuleKey,
  isCustomCourseKey
} from "@/lib/custom-course-colors"
import { customCoursesToAllIndexes } from "@/lib/custom-course-to-index"
import {
  diagnoseConstraints,
  generateCombinations,
  type ConstraintSuggestion
} from "@/lib/generate-timetable-combinations"
import { latestSemester, latestYear } from "@/lib/semesters"
import { useSeasonIndexes } from "@/hooks/use-season-indexes"
import { useTimetable } from "@/hooks/use-timetable"

const RESULT_LIMIT = 60
const TIME_BUDGET_MS = 300
/**
 * Unique mode throws away look-alike leaves, so it needs a bigger budget to
 * reach the same number of usable results.
 */
const UNIQUE_TIME_BUDGET_MS = 700

export function useTimetableGeneration() {
  const { timetable, timetableIndex, updateTimetable } = useTimetable()
  const { indexes: seasonIndexes } = useSeasonIndexes(
    latestYear,
    latestSemester
  )
  const generationConfig = useBoundState((s) => s.generationConfig)
  const uniqueTimeslotsOnly = useBoundState((s) => s.uniqueTimeslotsOnly)
  const lockedModules = useBoundState((s) => s.lockedModules)
  const customCourses = useBoundState((s) => s.customCourses)
  const setCustomCourses = useBoundState((s) => s.setCustomCourses)

  const [combinations, setCombinations] = useState<GeneratedCombination[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [truncated, setTruncated] = useState(false)
  const [duplicatesSkipped, setDuplicatesSkipped] = useState(0)
  const [hasGenerated, setHasGenerated] = useState(false)
  const [suggestions, setSuggestions] = useState<ConstraintSuggestion[]>([])
  const [isDiagnosing, setIsDiagnosing] = useState(false)

  const currentCustomCourses = useMemo(
    () => customCourses[timetableIndex] ?? [],
    [customCourses, timetableIndex]
  )

  /**
   * Custom blocks are fed to the generator as pseudo-modules keyed
   * `__CC__<courseId>`, each of their variants acting as an index. Everything
   * downstream — collision detection, scoring, locking — then treats them like
   * any other module.
   */
  const customIndexes = useMemo(
    () => customCoursesToAllIndexes(currentCustomCourses),
    [currentCustomCourses]
  )

  const allIndexes = useMemo<Record<string, Indexes>>(
    () => ({ ...seasonIndexes, ...customIndexes }),
    [seasonIndexes, customIndexes]
  )

  const moduleKeys = useMemo(() => Object.keys(timetable), [timetable])

  // Custom blocks go first: their slots are fixed, so they prune the search
  // tree earliest.
  const generationKeys = useMemo(
    () => [...Object.keys(customIndexes), ...moduleKeys],
    [customIndexes, moduleKeys]
  )

  const seededTimetable = useMemo<Timetable>(() => {
    const seeded: Timetable = { ...timetable }
    for (const course of currentCustomCourses) {
      const key = customCourseModuleKey(course.id)
      if (customIndexes[key]) seeded[key] = course.selectedIndexId
    }
    return seeded
  }, [timetable, currentCustomCourses, customIndexes])

  /**
   * Split a generated result back into its two homes: module indexes into the
   * timetable, custom block variants onto the custom courses themselves.
   */
  const applyCombination = useCallback(
    (combination: GeneratedCombination, planIndex: number) => {
      const moduleTimetable: Timetable = {}
      const customSelections: Record<string, string> = {}

      for (const [key, indexKey] of Object.entries(combination.timetable)) {
        if (isCustomCourseKey(key)) {
          customSelections[customCourseIdFromKey(key)] = indexKey
        } else {
          moduleTimetable[key] = indexKey
        }
      }

      updateTimetable(moduleTimetable, planIndex)

      const source = customCourses[planIndex] ?? []
      if (source.length > 0) {
        setCustomCourses(
          source.map((course) => ({
            ...course,
            selectedIndexId:
              customSelections[course.id] ?? course.selectedIndexId
          })),
          planIndex
        )
      }
    },
    [customCourses, setCustomCourses, updateTimetable]
  )

  const generate = useCallback(
    (
      config = generationConfig,
      maxResults = RESULT_LIMIT,
      unique = uniqueTimeslotsOnly
    ) => {
      if (moduleKeys.length === 0) return
      setIsGenerating(true)
      setSuggestions([])
      setIsDiagnosing(false)
      setTimeout(() => {
        const result = generateCombinations(
          generationKeys,
          allIndexes,
          config,
          {
            maxResults,
            lockedModules,
            currentTimetable: seededTimetable,
            uniqueTimeslotsOnly: unique,
            timeBudgetMs: unique ? UNIQUE_TIME_BUDGET_MS : TIME_BUDGET_MS
          }
        )
        setCombinations(result.combinations)
        setTruncated(result.truncated)
        setDuplicatesSkipped(result.duplicatesSkipped)
        setHasGenerated(true)
        if (result.combinations.length > 0) {
          applyCombination(result.combinations[0], timetableIndex)
        }
        setCurrentIdx(0)
        setIsGenerating(false)
        track("timetable_generation_completed", {
          result_count: result.combinations.length,
          truncated: result.truncated,
          unique_only: unique
        })
        if (result.combinations.length === 0) {
          setIsDiagnosing(true)
          setTimeout(() => {
            const diag = diagnoseConstraints(generationKeys, allIndexes, config)
            setSuggestions(diag)
            setIsDiagnosing(false)
          }, 10)
        }
      }, 10)
    },
    [
      moduleKeys,
      generationKeys,
      allIndexes,
      generationConfig,
      uniqueTimeslotsOnly,
      lockedModules,
      seededTimetable,
      timetableIndex,
      applyCombination
    ]
  )

  const navigateTo = useCallback(
    (idx: number) => {
      if (!combinations[idx]) return
      setCurrentIdx(idx)
      applyCombination(combinations[idx], timetableIndex)
    },
    [combinations, timetableIndex, applyCombination]
  )

  const saveToPlan = useCallback(
    (planIndex: number) => {
      if (!combinations[currentIdx]) return
      applyCombination(combinations[currentIdx], planIndex)
    },
    [combinations, currentIdx, applyCombination]
  )

  const reset = useCallback(() => {
    setCombinations([])
    setCurrentIdx(0)
    setTruncated(false)
    setDuplicatesSkipped(0)
    setHasGenerated(false)
    setSuggestions([])
    setIsDiagnosing(false)
  }, [])

  // Generated results belong to whichever plan was viewed when generate()
  // ran. Switching plans invalidates them, so cycling left/right must not
  // silently apply a stale combination to the newly viewed plan.
  useEffect(() => {
    reset()
  }, [timetableIndex, reset])

  return {
    combinations,
    currentIdx,
    isGenerating,
    isDiagnosing,
    truncated,
    duplicatesSkipped,
    hasGenerated,
    suggestions,
    moduleKeys,
    generate,
    navigateTo,
    saveToPlan,
    reset
  }
}
