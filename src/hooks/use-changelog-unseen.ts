"use client"

import { useEffect, useState } from "react"

import { CHANGELOG_IDS, LATEST_CHANGELOG_ID } from "@/config/changelog-data"

import { useHydrated } from "./use-hydrated"
import { usePathname } from "./use-pathname"

const SEEN_KEY = "changelog-last-seen"
const SEEN_EVENT = "ntumods:changelog-seen"

const countUnseen = (seenId: string | null): number => {
  if (seenId === null) return CHANGELOG_IDS.length
  const idx = CHANGELOG_IDS.indexOf(seenId)
  return idx === -1 ? CHANGELOG_IDS.length : idx
}

const computeUnseen = (): number => countUnseen(localStorage.getItem(SEEN_KEY))

// Read once at module load, before any effect marks the changelog as seen,
// so the changelog page can still flag the releases that were new on arrival.
// Full page loads only (no client router), so this is fresh per visit.
const seenIdOnLoad =
  typeof window === "undefined" ? null : localStorage.getItem(SEEN_KEY)

export const UNSEEN_CHANGELOG_IDS = new Set(
  CHANGELOG_IDS.slice(0, countUnseen(seenIdOnLoad))
)

export function useChangelogUnseenCount() {
  const hydrated = useHydrated()
  const [count, setCount] = useState(0)
  const pathname = usePathname()

  useEffect(() => {
    if (!hydrated) return
    setCount(computeUnseen())

    const sync = () => setCount(computeUnseen())
    window.addEventListener(SEEN_EVENT, sync)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener(SEEN_EVENT, sync)
      window.removeEventListener("storage", sync)
    }
  }, [hydrated])

  useEffect(() => {
    if (!pathname.startsWith("/changelog")) return
    localStorage.setItem(SEEN_KEY, LATEST_CHANGELOG_ID)
    setCount(0)
    window.dispatchEvent(new Event(SEEN_EVENT))
  }, [pathname])

  return count
}
