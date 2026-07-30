"use client"

import { useEffect, useState } from "react"

import { CHANGELOG_IDS, LATEST_CHANGELOG_ID } from "@/config/changelog-data"

import { useHydrated } from "./use-hydrated"
import { usePathname } from "./use-pathname"

const SEEN_KEY = "changelog-last-seen"
const SEEN_EVENT = "ntumods:changelog-seen"

const computeUnseen = (): number => {
  const seenId = localStorage.getItem(SEEN_KEY)
  if (seenId === null) return CHANGELOG_IDS.length
  const idx = CHANGELOG_IDS.indexOf(seenId)
  return idx === -1 ? CHANGELOG_IDS.length : idx
}

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
