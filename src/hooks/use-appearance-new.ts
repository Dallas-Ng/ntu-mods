"use client"

import { useEffect, useState } from "react"

import { APPEARANCE_FEATURE_RELEASED } from "@/config/appearance-settings"

const KEY = "appearance-opened-at"

const isStale = (openedAt: string | null) =>
  openedAt === null || openedAt < APPEARANCE_FEATURE_RELEASED

/**
 * True until the student opens Appearance on or after the release of its
 * newest feature. The stamp is a date, so a later feature only has to move
 * the release date to bring the pulse back for everyone.
 */
export function useAppearanceNew(open: boolean) {
  const [isNew, setIsNew] = useState(false)

  useEffect(() => {
    try {
      setIsNew(isStale(localStorage.getItem(KEY)))
    } catch {
      setIsNew(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    try {
      localStorage.setItem(KEY, new Date().toISOString())
    } catch {
      // Storage blocked: the pulse just clears for this visit.
    }
    setIsNew(false)
  }, [open])

  return isNew
}

const GRANULAR_KEY = "granular-control-seen"

/**
 * The same pulse for the Granular control row itself. It stays until the
 * student turns the setting on or reads how it works, not merely until they
 * open Appearance.
 */
export function useGranularNew() {
  const [isNew, setIsNew] = useState(false)

  useEffect(() => {
    try {
      setIsNew(isStale(localStorage.getItem(GRANULAR_KEY)))
    } catch {
      setIsNew(false)
    }
  }, [])

  const markSeen = () => {
    try {
      localStorage.setItem(GRANULAR_KEY, new Date().toISOString())
    } catch {
      // Storage blocked: the pulse just clears for this visit.
    }
    setIsNew(false)
  }

  return { isNew, markSeen }
}
