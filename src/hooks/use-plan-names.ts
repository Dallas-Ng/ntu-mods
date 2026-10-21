"use client"

import { useCallback } from "react"
import { useBoundState } from "@/state/bound.state"

import { isPlanNamed, planLabel } from "@/lib/plan-name"

export const usePlanNames = () => {
  const names = useBoundState((s) => s.planNames)
  const setPlanName = useBoundState((s) => s.setPlanName)
  const label = useCallback((i: number) => planLabel(names, i), [names])
  const named = useCallback((i: number) => isPlanNamed(names, i), [names])
  return { names, label, named, setPlanName }
}
